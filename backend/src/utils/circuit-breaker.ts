/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures when external APIs are down
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests fail immediately
 * - HALF_OPEN: Testing if service recovered
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close from half-open
  timeout: number; // Time in ms before attempting to close
  name: string; // Name for logging
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = Date.now();
  private options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 2,
      timeout: options.timeout || 60000, // 1 minute default
      name: options.name || 'CircuitBreaker',
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(
          `[${this.options.name}] Circuit breaker is OPEN. Next attempt at ${new Date(
            this.nextAttempt
          ).toISOString()}`
        );
      }
      // Transition to HALF_OPEN to test the service
      this.state = CircuitState.HALF_OPEN;
      console.log(`[${this.options.name}] Circuit breaker transitioning to HALF_OPEN`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      console.log(
        `[${this.options.name}] Success in HALF_OPEN state (${this.successCount}/${this.options.successThreshold})`
      );

      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        console.log(`[${this.options.name}] Circuit breaker CLOSED`);
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;

    console.log(
      `[${this.options.name}] Failure recorded (${this.failureCount}/${this.options.failureThreshold})`
    );

    if (
      this.failureCount >= this.options.failureThreshold ||
      this.state === CircuitState.HALF_OPEN
    ) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.timeout;
      console.log(
        `[${this.options.name}] Circuit breaker OPEN until ${new Date(
          this.nextAttempt
        ).toISOString()}`
      );
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.state === CircuitState.OPEN ? new Date(this.nextAttempt) : null,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    console.log(`[${this.options.name}] Circuit breaker manually reset`);
  }

  /**
   * Check if circuit breaker is allowing requests
   */
  isAvailable(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }
    if (this.state === CircuitState.HALF_OPEN) {
      return true;
    }
    if (this.state === CircuitState.OPEN && Date.now() >= this.nextAttempt) {
      return true;
    }
    return false;
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers for different services
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker for a service
   */
  getBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(
        name,
        new CircuitBreaker({
          ...options,
          name,
        })
      );
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breaker stats
   */
  getAllStats() {
    const stats: Record<string, any> = {};
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * Reset a specific circuit breaker
   */
  reset(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }
}

// Global circuit breaker manager instance
export const circuitBreakerManager = new CircuitBreakerManager();