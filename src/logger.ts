export type LogLevel = 'v' | 'd' | 'i' | 'w' | 'e';

export class Logs {
  private static level: LogLevel = 'd'; // default log level
  private static readonly levels = ['v', 'd', 'i', 'w', 'e']; // 'v' < 'd' < 'i' < 'w' < 'e

  private static parseLevel(level: LogLevel): string {
    switch (level) {
      case 'v':
        return 'VERBOSE';
      case 'd':
        return 'DEBUG';
      case 'i':
        return 'INFO';
      case 'w':
        return 'WARN';
      case 'e':
        return 'ERROR';
      default:
        return 'UNKNOWN';
    }
  }

  // private constructor to prevent instantiation
  private constructor() { }

  // private static method to print log message with log level
  private static print(
    level: LogLevel,
    message: any,
    time?: Date,
    error?: any,
    stackTrace?: any
  ): void {
    if (this.levels.indexOf(this.level) > this.levels.indexOf(level)) {
      return;
    }

    const prefix = time ? `[${time.toISOString()}]` : new Date().toISOString();
    const errorMessage = error ? `Error: ${error}` : '';
    const stackTraceMessage = stackTrace ? `StackTrace: ${stackTrace}` : '';
    const msg = `${prefix} [${this.parseLevel(level)}] ${message} ${errorMessage} ${stackTraceMessage}`;

    switch (level) {
      case 'v':
        console.log(msg);
        break;
      case 'd':
        console.debug(msg);
        break;
      case 'i':
        console.info(msg);
        break;
      case 'w':
        console.warn(msg);
        break;
      case 'e':
        console.error(msg);
        break;
      default:
        console.log(msg);
        break;
    }
  }

  static d(
    message: any,
    time?: Date,
    error?: any,
    stackTrace?: any
  ): void {
    this.print('d', message, time, error, stackTrace);
  }

  static e(
    message: any,
    time?: Date,
    error?: any,
    stackTrace?: any
  ): void {
    this.print('e', message, time, error, stackTrace);
  }

  static i(
    message: any,
    time?: Date,
    error?: any,
    stackTrace?: any
  ): void {
    this.print('i', message, time, error, stackTrace);
  }

  static w(
    message: any,
    time?: Date,
    error?: any,
    stackTrace?: any
  ): void {
    this.print('w', message, time, error, stackTrace);
  }

  static v(
    message: any,
    time?: Date,
    error?: any,
    stackTrace?: any
  ): void {
    this.print('v', message, time, error, stackTrace);
  }

  static setLevel(level: LogLevel): void {
    if (level === this.level) {
      return;
    }
    
    if (this.levels.includes(level)) {
      this.level = level;
    } else {
      throw new Error(`Invalid log level: ${level}`);
    }

    this.print('v', `Log level set to ${level}`);
  }

  static getLevel(): LogLevel {
    return this.level;
  }
}
