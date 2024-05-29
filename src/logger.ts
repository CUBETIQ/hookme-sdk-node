export class Logs {
    // level 0: debug, 1: error, 2: info, 3: warning, 4: verbose
    private static print(
      level: number,
      message: any,
      time?: Date,
      error?: any,
      stackTrace?: any
    ): void {
      const prefix = time ? `[${time.toISOString()}]` : '';
      const errorMessage = error ? `Error: ${error}` : '';
      const stackTraceMessage = stackTrace ? `StackTrace: ${stackTrace}` : '';
      console.log(`${prefix} ${message} ${errorMessage} ${stackTraceMessage}`);
    }
  
    static d(
      message: any,
      time?: Date,
      error?: any,
      stackTrace?: any
    ): void {
      this.print(0, message, time, error, stackTrace);
    }
  
    static e(
      message: any,
      time?: Date,
      error?: any,
      stackTrace?: any
    ): void {
      this.print(1, message, time, error, stackTrace);
    }
  
    static i(
      message: any,
      time?: Date,
      error?: any,
      stackTrace?: any
    ): void {
      this.print(2, message, time, error, stackTrace);
    }
  }
  