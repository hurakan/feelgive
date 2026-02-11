import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to verify admin access
 * Checks if the request contains a valid admin email or admin header
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get admin emails from environment variable
    const adminEmailsEnv = process.env.ADMIN_EMAILS || 'admin@feelgive.com';
    const adminEmails = adminEmailsEnv.split(',').map(email => email.trim().toLowerCase());

    // Check for admin header (for development/testing)
    const adminHeader = req.headers['x-admin-key'];
    const adminKey = process.env.ADMIN_KEY;

    // Debug logging (remove after fixing)
    console.log('[isAdmin] Debug:', {
      hasAdminKey: !!adminKey,
      adminKeyLength: adminKey?.length,
      adminKeyPreview: adminKey ? `${adminKey.substring(0, 5)}...` : 'undefined',
      hasAdminHeader: !!adminHeader,
      adminHeaderType: typeof adminHeader,
      adminHeaderLength: typeof adminHeader === 'string' ? adminHeader.length : 'N/A',
      adminHeaderPreview: typeof adminHeader === 'string' ? `${adminHeader.substring(0, 5)}...` : adminHeader,
      matches: adminKey && adminHeader === adminKey
    });

    // If admin key is set and matches, allow access
    if (adminKey && adminHeader === adminKey) {
      console.log('[isAdmin] Access granted via admin key');
      next();
      return;
    }

    // Check for user email in request (could be from auth token, query param, or body)
    const userEmail = (
      req.body?.userEmail || 
      req.query?.userEmail || 
      req.headers['x-user-email']
    )?.toString().toLowerCase();

    // Verify if user email is in admin list
    if (userEmail && adminEmails.includes(userEmail)) {
      next();
      return;
    }

    // If no valid admin credentials found, deny access
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required. Please contact support if you believe this is an error.',
    });
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify admin access',
    });
  }
};