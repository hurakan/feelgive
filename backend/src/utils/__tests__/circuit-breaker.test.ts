import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { CircuitBreaker, CircuitBreakerManager, CircuitState } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      name: 'TestService',
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 5000,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('State Management', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition to OPEN after threshold failures', async () => {
      const failingOperation = async () => {
        throw new Error('Service error');
      };

      // Trigger failures up to threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      jest.useFakeTimers();
      const failingOperation = async () => {
        throw new Error('Service error');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Fast-forward time past timeout
      jest.advanceTimersByTime(5000);

      // Next call should transition to HALF_OPEN
      try {
        await circuitBreaker.execute(failingOperation);
      } catch (error) {
        // Expected
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);

      jest.useRealTimers();
    });

    it('should transition from HALF_OPEN to CLOSED on success threshold', async () => {
      jest.useFakeTimers();
      const failingOperation = async () => {
        throw new Error('Service error');
      };
      const successOperation = async () => 'success';

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      // Wait for timeout
      jest.advanceTimersByTime(5000);

      // Successful calls in HALF_OPEN should close circuit after threshold
      await circuitBreaker.execute(successOperation);
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      
      await circuitBreaker.execute(successOperation);
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);

      jest.useRealTimers();
    });

    it('should transition from HALF_OPEN to OPEN on failure', async () => {
      jest.useFakeTimers();
      const failingOperation = async () => {
        throw new Error('Service error');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      // Wait for timeout
      jest.advanceTimersByTime(5000);

      // Failed call in HALF_OPEN should reopen circuit
      try {
        await circuitBreaker.execute(failingOperation);
      } catch (error) {
        // Expected
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      jest.useRealTimers();
    });
  });

  describe('Operation Execution', () => {
    it('should execute operation successfully in CLOSED state', async () => {
      const operation = async () => 'success';
      const result = await circuitBreaker.execute(operation);

      expect(result).toBe('success');
    });

    it('should reject immediately in OPEN state', async () => {
      const failingOperation = async () => {
        throw new Error('Service error');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      // Try to execute - should fail immediately
      await expect(circuitBreaker.execute(async () => 'test')).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should reset failure count on success', async () => {
      const failingOperation = async () => {
        throw new Error('Service error');
      };
      const successOperation = async () => 'success';

      // Trigger some failures (but not enough to open)
      for (let i = 0; i < 2; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      // Success should reset count
      await circuitBreaker.execute(successOperation);

      // Should be able to fail 3 more times before opening
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Statistics', () => {
    it('should track failure count', async () => {
      const failingOperation = async () => {
        throw new Error('Service error');
      };

      for (let i = 0; i < 2; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      const stats = circuitBreaker.getStats();
      expect(stats.failureCount).toBe(2);
    });

    it('should calculate next attempt time in OPEN state', async () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      const failingOperation = async () => {
        throw new Error('Service error');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      const stats = circuitBreaker.getStats();
      expect(stats.nextAttempt).toBeInstanceOf(Date);
      expect(stats.nextAttempt!.getTime()).toBe(now + 5000);

      jest.useRealTimers();
    });

    it('should return null for nextAttempt in CLOSED state', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.nextAttempt).toBeNull();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset circuit breaker state', async () => {
      const failingOperation = async () => {
        throw new Error('Service error');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Reset
      circuitBreaker.reset();

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      const stats = circuitBreaker.getStats();
      expect(stats.failureCount).toBe(0);
    });
  });

  describe('Availability Check', () => {
    it('should be available in CLOSED state', () => {
      expect(circuitBreaker.isAvailable()).toBe(true);
    });

    it('should be available in HALF_OPEN state', async () => {
      jest.useFakeTimers();
      const failingOperation = async () => {
        throw new Error('Service error');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      // Wait for timeout
      jest.advanceTimersByTime(5000);

      expect(circuitBreaker.isAvailable()).toBe(true);

      jest.useRealTimers();
    });

    it('should not be available in OPEN state before timeout', async () => {
      const failingOperation = async () => {
        throw new Error('Service error');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.isAvailable()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle synchronous errors', async () => {
      const operation = async () => {
        throw new Error('Sync error');
      };

      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Sync error');
    });

    it('should handle operations that return undefined', async () => {
      const operation = async () => undefined;

      const result = await circuitBreaker.execute(operation);
      expect(result).toBeUndefined();
    });

    it('should handle operations that return null', async () => {
      const operation = async () => null;

      const result = await circuitBreaker.execute(operation);
      expect(result).toBeNull();
    });

    it('should handle operations that return objects', async () => {
      const operation = async () => ({ data: 'test' });

      const result = await circuitBreaker.execute(operation);
      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent operations', async () => {
      const operation = async () => 'success';

      const promises = Array(10).fill(null).map(() => 
        circuitBreaker.execute(operation)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(results.every(r => r === 'success')).toBe(true);
    });

    it('should handle mixed success/failure operations', async () => {
      let callCount = 0;
      const mixedOperation = async () => {
        callCount++;
        if (callCount % 2 === 0) {
          return 'success';
        }
        throw new Error('failure');
      };

      const promises = Array(6).fill(null).map(() => 
        circuitBreaker.execute(mixedOperation).catch(e => e)
      );

      await Promise.all(promises);
      
      // Should be OPEN after 3 failures
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Configuration', () => {
    it('should use default options when not provided', () => {
      const cb = new CircuitBreaker();
      const stats = cb.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
    });

    it('should use custom failure threshold', async () => {
      const cb = new CircuitBreaker({
        name: 'CustomTest',
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 1000,
      });

      const failingOperation = async () => {
        throw new Error('error');
      };

      // Should need 5 failures to open
      for (let i = 0; i < 4; i++) {
        try {
          await cb.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      expect(cb.getState()).toBe(CircuitState.CLOSED);

      try {
        await cb.execute(failingOperation);
      } catch (error) {
        // Expected
      }

      expect(cb.getState()).toBe(CircuitState.OPEN);
    });
  });
});

describe('CircuitBreakerManager', () => {
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    manager = new CircuitBreakerManager();
  });

  describe('Circuit Breaker Creation', () => {
    it('should create and retrieve circuit breakers', () => {
      const cb = manager.getBreaker('TestService');
      expect(cb).toBeInstanceOf(CircuitBreaker);
    });

    it('should return same instance for same service', () => {
      const cb1 = manager.getBreaker('TestService');
      const cb2 = manager.getBreaker('TestService');
      expect(cb1).toBe(cb2);
    });

    it('should create different instances for different services', () => {
      const cb1 = manager.getBreaker('Service1');
      const cb2 = manager.getBreaker('Service2');
      expect(cb1).not.toBe(cb2);
    });

    it('should use custom options when provided', () => {
      const cb = manager.getBreaker('TestService', {
        failureThreshold: 5,
        timeout: 2000,
      });

      const stats = cb.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
    });
  });

  describe('Manager Operations', () => {
    it('should reset specific circuit breaker', async () => {
      const cb = manager.getBreaker('TestService');
      const failingOp = async () => {
        throw new Error('error');
      };

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await cb.execute(failingOp);
        } catch (error) {
          // Expected
        }
      }

      expect(cb.getState()).toBe(CircuitState.OPEN);

      manager.reset('TestService');
      expect(cb.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reset all circuit breakers', async () => {
      const cb1 = manager.getBreaker('Service1');
      const cb2 = manager.getBreaker('Service2');
      const failingOp = async () => {
        throw new Error('error');
      };

      // Open both circuits
      for (let i = 0; i < 5; i++) {
        try {
          await cb1.execute(failingOp);
          await cb2.execute(failingOp);
        } catch (error) {
          // Expected
        }
      }

      expect(cb1.getState()).toBe(CircuitState.OPEN);
      expect(cb2.getState()).toBe(CircuitState.OPEN);

      manager.resetAll();

      expect(cb1.getState()).toBe(CircuitState.CLOSED);
      expect(cb2.getState()).toBe(CircuitState.CLOSED);
    });

    it('should get stats for all circuit breakers', async () => {
      manager.getBreaker('Service1');
      manager.getBreaker('Service2');

      const allStats = manager.getAllStats();
      expect(Object.keys(allStats)).toHaveLength(2);
      expect(allStats['Service1']).toBeDefined();
      expect(allStats['Service2']).toBeDefined();
    });

    it('should handle reset of non-existent breaker gracefully', () => {
      expect(() => manager.reset('NonExistent')).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle many circuit breakers efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        manager.getBreaker(`Service${i}`);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should handle many operations efficiently', async () => {
      const cb = manager.getBreaker('TestService');
      const operation = async () => 'success';

      const start = Date.now();

      const promises = Array(1000).fill(null).map(() => 
        cb.execute(operation)
      );

      await Promise.all(promises);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // Should complete in reasonable time
    });
  });
});