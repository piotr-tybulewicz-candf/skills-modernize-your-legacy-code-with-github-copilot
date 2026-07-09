const {
  DataProgram,
  formatBalance,
  processOperation,
  runMainProgram,
} = require("../index");

function createMockIO(inputs) {
  const queue = [...inputs];
  const logs = [];
  const prompts = [];

  return {
    logs,
    prompts,
    question(prompt) {
      prompts.push(prompt);
      if (queue.length === 0) {
        throw new Error(`No input left for prompt: ${prompt}`);
      }
      return String(queue.shift());
    },
    log(message) {
      logs.push(String(message));
    },
  };
}

describe("Accounting application behavior from COBOL test plan", () => {
  test("TC-001 displays main menu", () => {
    const io = createMockIO([4]);
    runMainProgram(io);

    expect(io.logs).toContain("1. View Balance");
    expect(io.logs).toContain("2. Credit Account");
    expect(io.logs).toContain("3. Debit Account");
    expect(io.logs).toContain("4. Exit");
  });

  test("TC-002 views initial balance", () => {
    const io = createMockIO([1, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Current balance: 001000.00");
  });

  test("TC-003 credits account with valid amount", () => {
    const io = createMockIO([2, 500, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Amount credited. New balance: 001500.00");
  });

  test("TC-004 credits account with zero amount", () => {
    const io = createMockIO([2, 0, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Amount credited. New balance: 001000.00");
  });

  test("TC-005 credits account with decimal amount", () => {
    const io = createMockIO([2, 250.5, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Amount credited. New balance: 001250.50");
  });

  test("TC-006 credits account up to maximum balance", () => {
    const io = createMockIO([2, 998999.99, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Amount credited. New balance: 999999.99");
  });

  test("TC-007 credit overflow wraps on fixed-width numeric behavior", () => {
    const io = createMockIO([2, 998999.99, 2, 1, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Amount credited. New balance: 000000.99");
  });

  test("TC-008 debits account with sufficient funds", () => {
    const io = createMockIO([3, 200, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Amount debited. New balance: 000800.00");
  });

  test("TC-009 debits account with exact balance", () => {
    const io = createMockIO([3, 1000, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Amount debited. New balance: 000000.00");
  });

  test("TC-010 blocks debit when funds are insufficient", () => {
    const io = createMockIO([3, 1500, 1, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Insufficient funds for this debit.");
    expect(io.logs).toContain("Current balance: 001000.00");
  });

  test("TC-011 debits account with zero amount", () => {
    const io = createMockIO([3, 0, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Amount debited. New balance: 001000.00");
  });

  test("TC-012 debits account with decimal amount", () => {
    const io = createMockIO([3, 100.75, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Amount debited. New balance: 000899.25");
  });

  test("TC-013 persists balance after credit then view", () => {
    const io = createMockIO([2, 300, 1, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Amount credited. New balance: 001300.00");
    expect(io.logs).toContain("Current balance: 001300.00");
  });

  test("TC-014 persists balance after debit then view", () => {
    const io = createMockIO([3, 400, 1, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Amount debited. New balance: 000600.00");
    expect(io.logs).toContain("Current balance: 000600.00");
  });

  test("TC-015 supports multiple sequential operations", () => {
    const io = createMockIO([2, 500, 3, 200, 1, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Amount credited. New balance: 001500.00");
    expect(io.logs).toContain("Amount debited. New balance: 001300.00");
    expect(io.logs).toContain("Current balance: 001300.00");
  });

  test("TC-016 handles invalid menu choice", () => {
    const io = createMockIO([5, 4]);
    runMainProgram(io);

    expect(io.logs).toContain("Invalid choice, please select 1-4.");
    const menuCount = io.logs.filter((line) => line === "Account Management System").length;
    expect(menuCount).toBeGreaterThanOrEqual(2);
  });

  test("TC-017 exits application", () => {
    const io = createMockIO([4]);
    runMainProgram(io);

    expect(io.logs).toContain("Exiting the program. Goodbye!");
  });

  test("TC-018 menu loops after each operation", () => {
    const io = createMockIO([1, 4]);
    runMainProgram(io);

    const menuCount = io.logs.filter((line) => line === "Account Management System").length;
    expect(menuCount).toBe(2);
  });

  test("TC-019 Data READ returns stored value on fresh start", () => {
    const dataProgram = new DataProgram();

    expect(dataProgram.process("READ")).toBe(1000);
  });

  test("TC-020 Data WRITE then READ round-trip", () => {
    const dataProgram = new DataProgram();

    dataProgram.process("WRITE", 750);

    expect(formatBalance(dataProgram.process("READ"))).toBe("000750.00");
  });

  test("Operation-level routing still matches COBOL operation code behavior", () => {
    const dataProgram = new DataProgram();
    const io = createMockIO([125]);

    processOperation("CREDIT", dataProgram, io);
    processOperation("TOTAL ", dataProgram, io);

    expect(io.logs).toContain("Amount credited. New balance: 001125.00");
    expect(io.logs).toContain("Current balance: 001125.00");
  });
});
