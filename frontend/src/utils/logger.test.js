import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("logger", () => {
  let consoleErrorSpy;
  let consoleWarnSpy;
  let consoleInfoSpy;
  let consoleDebugSpy;

  beforeEach(() => {
    // Spy on console methods
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    
    // Clear module cache to allow re-import with new env values
    vi.resetModules();
  });

  describe("in development mode", () => {
    beforeEach(() => {
      vi.stubEnv("DEV", true);
    });

    it("should log error messages to console.error", async () => {
      const { logger } = await import("./logger");
      const message = "Test error message";
      const error = new Error("Test error");
      
      logger.error(message, error);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(message, error);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it("should log warning messages to console.warn", async () => {
      const { logger } = await import("./logger");
      const message = "Test warning message";
      const data = { key: "value" };
      
      logger.warn(message, data);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(message, data);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });

    it("should log info messages to console.info", async () => {
      const { logger } = await import("./logger");
      const message = "Test info message";
      
      logger.info(message);
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(message);
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    });

    it("should log debug messages to console.debug", async () => {
      const { logger } = await import("./logger");
      const message = "Test debug message";
      const data = [1, 2, 3];
      
      logger.debug(message, data);
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(message, data);
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple arguments", async () => {
      const { logger } = await import("./logger");
      const message = "Multiple args";
      const arg1 = "arg1";
      const arg2 = { key: "value" };
      const arg3 = 123;
      
      logger.error(message, arg1, arg2, arg3);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(message, arg1, arg2, arg3);
    });

    it("should handle no additional arguments", async () => {
      const { logger } = await import("./logger");
      const message = "Just a message";
      
      logger.error(message);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(message);
    });
  });

  describe("in production mode", () => {
    beforeEach(() => {
      vi.stubEnv("DEV", false);
    });

    it("should not log error messages to console", async () => {
      const { logger } = await import("./logger");
      const message = "Test error message";
      const error = new Error("Test error");
      
      logger.error(message, error);
      
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should not log warning messages to console", async () => {
      const { logger } = await import("./logger");
      const message = "Test warning message";
      
      logger.warn(message);
      
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should not log info messages to console", async () => {
      const { logger } = await import("./logger");
      const message = "Test info message";
      
      logger.info(message);
      
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it("should not log debug messages to console", async () => {
      const { logger } = await import("./logger");
      const message = "Test debug message";
      
      logger.debug(message);
      
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe("logger API", () => {
    it("should expose error method", async () => {
      const { logger } = await import("./logger");
      expect(logger.error).toBeDefined();
      expect(typeof logger.error).toBe("function");
    });

    it("should expose warn method", async () => {
      const { logger } = await import("./logger");
      expect(logger.warn).toBeDefined();
      expect(typeof logger.warn).toBe("function");
    });

    it("should expose info method", async () => {
      const { logger } = await import("./logger");
      expect(logger.info).toBeDefined();
      expect(typeof logger.info).toBe("function");
    });

    it("should expose debug method", async () => {
      const { logger } = await import("./logger");
      expect(logger.debug).toBeDefined();
      expect(typeof logger.debug).toBe("function");
    });
  });
});
