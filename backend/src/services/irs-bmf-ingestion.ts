import axios from 'axios';
import { createReadStream, createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { parse } from 'csv-parse';
import IrsBmfRecord from '../models/IrsBmfRecord.js';
import { EINNormalizer } from '../utils/ein-normalizer.js';

/**
 * IRS Business Master File Ingestion Service
 * Downloads and imports IRS BMF data into MongoDB
 * Uses streaming to handle large files without memory issues
 */

interface IRSBMFRow {
  EIN: string;
  NAME: string;
  ICO?: string;
  STREET?: string;
  CITY?: string;
  STATE?: string;
  ZIP?: string;
  GROUP?: string;
  SUBSECTION?: string;
  AFFILIATION?: string;
  CLASSIFICATION?: string;
  RULING?: string;
  DEDUCTIBILITY?: string;
  FOUNDATION?: string;
  ACTIVITY?: string;
  ORGANIZATION?: string;
  STATUS?: string;
  TAX_PERIOD?: string;
  ASSET_CD?: string;
  INCOME_CD?: string;
  FILING_REQ_CD?: string;
  PF_FILING_REQ_CD?: string;
  ACCT_PD?: string;
  ASSET_AMT?: string;
  INCOME_AMT?: string;
  REVENUE_AMT?: string;
  NTEE_CD?: string;
  SORT_NAME?: string;
}

export class IrsBmfIngestionService {
  private baseUrl = 'https://www.irs.gov/pub/irs-soi';
  private regions = ['1', '2', '3', '4']; // IRS splits data by region
  private batchSize = 1000; // Insert in batches for performance

  /**
   * Download and import all IRS BMF data
   */
  async importAll(): Promise<{
    success: boolean;
    totalRecords: number;
    errors: string[];
  }> {
    console.log('[IRS BMF] Starting full import...');
    
    let totalRecords = 0;
    const errors: string[] = [];

    for (const region of this.regions) {
      try {
        console.log(`[IRS BMF] Processing region ${region}...`);
        const count = await this.importRegion(region);
        totalRecords += count;
        console.log(`[IRS BMF] Region ${region} complete: ${count} records`);
      } catch (error: any) {
        const errorMsg = `Region ${region} failed: ${error.message}`;
        console.error(`[IRS BMF] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`[IRS BMF] Import complete: ${totalRecords} total records`);
    
    return {
      success: errors.length === 0,
      totalRecords,
      errors,
    };
  }

  /**
   * Download and import a single region
   */
  private async importRegion(region: string): Promise<number> {
    const url = `${this.baseUrl}/eo${region}.csv`;
    const tempFile = `/tmp/irs-bmf-region-${region}.csv`;

    try {
      // Download file
      console.log(`[IRS BMF] Downloading ${url}...`);
      await this.downloadFile(url, tempFile);

      // Stream and import
      console.log(`[IRS BMF] Importing from ${tempFile}...`);
      const count = await this.streamImport(tempFile, region);

      // Cleanup
      await unlink(tempFile);

      return count;
    } catch (error) {
      // Cleanup on error
      try {
        await unlink(tempFile);
      } catch {}
      throw error;
    }
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string, destination: string): Promise<void> {
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      timeout: 300000, // 5 minutes
    });

    await pipeline(response.data, createWriteStream(destination));
  }

  /**
   * Stream import CSV file into MongoDB
   */
  private async streamImport(filePath: string, region: string): Promise<number> {
    return new Promise((resolve, reject) => {
      let recordCount = 0;
      let batch: any[] = [];
      const importSource = `IRS_BMF_${new Date().toISOString().split('T')[0]}_REGION_${region}`;

      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
      });

      const stream = createReadStream(filePath).pipe(parser);

      stream.on('data', async (row: IRSBMFRow) => {
        try {
          // Normalize EIN
          const normalizedEIN = EINNormalizer.normalize(row.EIN);
          if (!normalizedEIN) {
            return; // Skip invalid EINs
          }

          // Parse numeric fields
          const assetAmount = row.ASSET_AMT ? parseInt(row.ASSET_AMT, 10) : undefined;
          const incomeAmount = row.INCOME_AMT ? parseInt(row.INCOME_AMT, 10) : undefined;
          const revenueAmount = row.REVENUE_AMT ? parseInt(row.REVENUE_AMT, 10) : undefined;

          // Create record
          const record = {
            ein: normalizedEIN,
            name: row.NAME,
            ico: row.ICO,
            street: row.STREET,
            city: row.CITY,
            state: row.STATE,
            zip: row.ZIP,
            nteeCode: row.NTEE_CD,
            subsectionCode: row.SUBSECTION,
            classification: row.CLASSIFICATION,
            affiliation: row.AFFILIATION,
            rulingDate: row.RULING,
            deductibilityCode: row.DEDUCTIBILITY,
            foundationCode: row.FOUNDATION,
            activityCodes: row.ACTIVITY,
            organizationCode: row.ORGANIZATION,
            exemptOrgStatusCode: row.STATUS,
            taxPeriod: row.TAX_PERIOD,
            assetCode: row.ASSET_CD,
            incomeCode: row.INCOME_CD,
            filingRequirementCode: row.FILING_REQ_CD,
            pfFilingRequirementCode: row.PF_FILING_REQ_CD,
            accountingPeriod: row.ACCT_PD,
            assetAmount: isNaN(assetAmount!) ? undefined : assetAmount,
            incomeAmount: isNaN(incomeAmount!) ? undefined : incomeAmount,
            revenueAmount: isNaN(revenueAmount!) ? undefined : revenueAmount,
            groupExemptionNumber: row.GROUP,
            sortName: row.SORT_NAME,
            importedAt: new Date(),
            importSource,
          };

          batch.push(record);

          // Insert batch when it reaches batchSize
          if (batch.length >= this.batchSize) {
            stream.pause(); // Pause stream while inserting
            await this.insertBatch(batch);
            recordCount += batch.length;
            batch = [];
            stream.resume(); // Resume stream
          }
        } catch (error: any) {
          console.error(`[IRS BMF] Error processing row:`, error.message);
        }
      });

      stream.on('end', async () => {
        try {
          // Insert remaining records
          if (batch.length > 0) {
            await this.insertBatch(batch);
            recordCount += batch.length;
          }
          resolve(recordCount);
        } catch (error) {
          reject(error);
        }
      });

      stream.on('error', (error: any) => {
        reject(error);
      });
    });
  }

  /**
   * Insert batch of records using bulkWrite for performance
   */
  private async insertBatch(records: any[]): Promise<void> {
    const operations = records.map(record => ({
      updateOne: {
        filter: { ein: record.ein },
        update: { $set: record },
        upsert: true,
      },
    }));

    try {
      await IrsBmfRecord.bulkWrite(operations, { ordered: false });
    } catch (error: any) {
      // Ignore duplicate key errors (expected with upsert)
      if (error.code !== 11000) {
        throw error;
      }
    }
  }

  /**
   * Get import statistics
   */
  async getStats(): Promise<{
    totalRecords: number;
    lastImport: Date | null;
    recordsByState: Record<string, number>;
    recordsByNTEE: Record<string, number>;
  }> {
    const totalRecords = await IrsBmfRecord.countDocuments();
    
    const lastImportDoc = await IrsBmfRecord.findOne()
      .sort({ importedAt: -1 })
      .select('importedAt');
    
    const byState = await IrsBmfRecord.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const byNTEE = await IrsBmfRecord.aggregate([
      { $match: { nteeCode: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: { $substr: ['$nteeCode', 0, 1] }, // Major category
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      totalRecords,
      lastImport: lastImportDoc?.importedAt || null,
      recordsByState: byState.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
      recordsByNTEE: byNTEE.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Lookup organization by EIN
   */
  async lookupByEIN(ein: string): Promise<any | null> {
    const normalizedEIN = EINNormalizer.normalize(ein);
    if (!normalizedEIN) {
      return null;
    }

    return await IrsBmfRecord.findOne({ ein: normalizedEIN }).lean();
  }

  /**
   * Search organizations by name
   */
  async searchByName(name: string, limit: number = 10): Promise<any[]> {
    return await IrsBmfRecord.find(
      { $text: { $search: name } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();
  }
}

// Export singleton instance
export const irsBmfIngestionService = new IrsBmfIngestionService();