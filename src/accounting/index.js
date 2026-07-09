const readlineSync = require("readline-sync");

const COBOL_MAX_CENTS = 100000000;

const defaultIO = {
  question(prompt) {
    return readlineSync.question(prompt);
  },
  log(message) {
    console.log(message);
  },
};

class DataProgram {
  constructor() {
    this.storageBalance = 1000.0;
  }

  process(operationType, balance) {
    if (operationType === "READ") {
      return this.storageBalance;
    }

    if (operationType === "WRITE") {
      this.storageBalance = normalizeAmount(balance);
      return this.storageBalance;
    }

    return this.storageBalance;
  }
}

function normalizeAmount(value) {
  const parsed = Number.parseFloat(value);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  const cents = Math.round(parsed * 100);
  const wrappedCents = ((cents % COBOL_MAX_CENTS) + COBOL_MAX_CENTS) % COBOL_MAX_CENTS;
  return Number((wrappedCents / 100).toFixed(2));
}

function formatBalance(balance) {
  const normalized = normalizeAmount(balance);
  const [integerPart, decimalPart] = normalized.toFixed(2).split(".");
  return `${integerPart.padStart(6, "0")}.${decimalPart}`;
}

function processOperation(passedOperation, dataProgram, io = defaultIO) {
  const operationType = passedOperation;

  if (operationType === "TOTAL ") {
    const finalBalance = dataProgram.process("READ");
    io.log(`Current balance: ${formatBalance(finalBalance)}`);
    return;
  }

  if (operationType === "CREDIT") {
    const amountInput = io.question("Enter credit amount: ");
    const amount = normalizeAmount(amountInput);
    let finalBalance = dataProgram.process("READ");

    finalBalance = normalizeAmount(finalBalance + amount);
    dataProgram.process("WRITE", finalBalance);

    io.log(`Amount credited. New balance: ${formatBalance(finalBalance)}`);
    return;
  }

  if (operationType === "DEBIT ") {
    const amountInput = io.question("Enter debit amount: ");
    const amount = normalizeAmount(amountInput);
    let finalBalance = dataProgram.process("READ");

    if (finalBalance >= amount) {
      finalBalance = normalizeAmount(finalBalance - amount);
      dataProgram.process("WRITE", finalBalance);
      io.log(`Amount debited. New balance: ${formatBalance(finalBalance)}`);
    } else {
      io.log("Insufficient funds for this debit.");
    }
  }
}

function runMainProgram(io = defaultIO, dataProgram = new DataProgram()) {
  let continueFlag = "YES";

  while (continueFlag !== "NO") {
    io.log("--------------------------------");
    io.log("Account Management System");
    io.log("1. View Balance");
    io.log("2. Credit Account");
    io.log("3. Debit Account");
    io.log("4. Exit");
    io.log("--------------------------------");

    const userChoice = Number.parseInt(
      io.question("Enter your choice (1-4): "),
      10,
    );

    switch (userChoice) {
      case 1:
        processOperation("TOTAL ", dataProgram, io);
        break;
      case 2:
        processOperation("CREDIT", dataProgram, io);
        break;
      case 3:
        processOperation("DEBIT ", dataProgram, io);
        break;
      case 4:
        continueFlag = "NO";
        break;
      default:
        io.log("Invalid choice, please select 1-4.");
        break;
    }
  }

  io.log("Exiting the program. Goodbye!");
}

if (require.main === module) {
  runMainProgram();
}

module.exports = {
  DataProgram,
  normalizeAmount,
  formatBalance,
  processOperation,
  runMainProgram,
};
