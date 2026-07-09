# Test Plan: Account Management System

## Overview

This test plan covers the business logic of the COBOL Account Management System, comprising three modules:

- **`main.cob`** — Entry point; renders the menu and routes user input.
- **`operations.cob`** — Implements View Balance, Credit, and Debit operations. Initial in-memory balance defaults to `1000.00`.
- **`data.cob`** — In-memory data store; supports READ and WRITE operations. Initial stored balance defaults to `1000.00`.

**Balance format:** 6 integer digits + 2 decimal digits (e.g. `001000.00`). Maximum storable value: `999999.99`.

---

## Test Cases

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| TC-001 | Display main menu | Application is compiled and running | Launch the application | Menu is displayed with options: `1. View Balance`, `2. Credit Account`, `3. Debit Account`, `4. Exit` | | | |
| TC-002 | View initial balance | Application is running; no prior transactions | Select option `1` from the menu | Display: `Current balance: 001000.00` | | | Initial balance is hardcoded to `1000.00` in `data.cob` |
| TC-003 | Credit account with valid amount | Application is running; current balance is `1000.00` | 1. Select option `2`<br>2. Enter amount `500` | Display: `Amount credited. New balance: 001500.00` | | | |
| TC-004 | Credit account with zero amount | Application is running | 1. Select option `2`<br>2. Enter amount `0` | Display: `Amount credited. New balance: 001000.00` (balance unchanged) | | | Zero credit is technically accepted; no guard exists |
| TC-005 | Credit account with decimal amount | Application is running; current balance is `1000.00` | 1. Select option `2`<br>2. Enter amount `250.50` | Display: `Amount credited. New balance: 001250.50` | | | |
| TC-006 | Credit account up to maximum balance | Application is running; current balance is `1000.00` | 1. Select option `2`<br>2. Enter amount `998999.99` | Display: `Amount credited. New balance: 999999.99` | | | Maximum storable value is `999999.99` due to `PIC 9(6)V99` |
| TC-007 | Credit account causing balance overflow | Application is running; current balance is `999999.99` | 1. Select option `2`<br>2. Enter amount `1` | Balance overflows / wraps due to fixed-width numeric field | | | Edge case — no overflow guard in COBOL code |
| TC-008 | Debit account with sufficient funds | Application is running; current balance is `1000.00` | 1. Select option `3`<br>2. Enter amount `200` | Display: `Amount debited. New balance: 000800.00` | | | |
| TC-009 | Debit account with exact balance (boundary) | Application is running; current balance is `1000.00` | 1. Select option `3`<br>2. Enter amount `1000` | Display: `Amount debited. New balance: 000000.00` | | | Balance should reach exactly zero |
| TC-010 | Debit account with insufficient funds | Application is running; current balance is `1000.00` | 1. Select option `3`<br>2. Enter amount `1500` | Display: `Insufficient funds for this debit.` Balance remains `001000.00` | | | Guard: `IF FINAL-BALANCE >= AMOUNT` |
| TC-011 | Debit account with zero amount | Application is running | 1. Select option `3`<br>2. Enter amount `0` | Display: `Amount debited. New balance: 001000.00` (balance unchanged) | | | Zero debit is technically accepted; no guard exists |
| TC-012 | Debit account with decimal amount | Application is running; current balance is `1000.00` | 1. Select option `3`<br>2. Enter amount `100.75` | Display: `Amount debited. New balance: 000899.25` | | | |
| TC-013 | Balance persists after credit then view | Application is running; current balance is `1000.00` | 1. Select option `2`, enter `300`<br>2. Select option `1` | After step 1: `Amount credited. New balance: 001300.00`<br>After step 2: `Current balance: 001300.00` | | | Validates READ/WRITE round-trip in `data.cob` |
| TC-014 | Balance persists after debit then view | Application is running; current balance is `1000.00` | 1. Select option `3`, enter `400`<br>2. Select option `1` | After step 1: `Amount debited. New balance: 000600.00`<br>After step 2: `Current balance: 000600.00` | | | Validates READ/WRITE round-trip in `data.cob` |
| TC-015 | Multiple sequential operations | Application is running; current balance is `1000.00` | 1. Credit `500` → balance `1500.00`<br>2. Debit `200` → balance `1300.00`<br>3. View balance | Final balance displayed: `001300.00` | | | |
| TC-016 | Invalid menu choice | Application is running | Enter `5` (or any value outside 1–4) at the menu | Display: `Invalid choice, please select 1-4.` Menu is shown again | | | Handled by `WHEN OTHER` in `EVALUATE` |
| TC-017 | Exit application | Application is running | Select option `4` from the menu | Display: `Exiting the program. Goodbye!` Application terminates | | | `CONTINUE-FLAG` set to `NO`; loop exits |
| TC-018 | Menu loops after each operation | Application is running | 1. Select option `1`<br>2. After result is displayed, verify menu re-appears | Menu is re-displayed after every completed operation until option `4` is chosen | | | Controlled by `PERFORM UNTIL CONTINUE-FLAG = 'NO'` |
| TC-019 | Data READ operation isolates stored value | Fresh application start | Call `DataProgram` with `READ`; observe returned balance | Returns the current `STORAGE-BALANCE` value (`1000.00` on first run) | | | Unit-level test of `data.cob` |
| TC-020 | Data WRITE then READ round-trip | Fresh application start | 1. Call `DataProgram` with `WRITE` and balance `750.00`<br>2. Call `DataProgram` with `READ` | READ returns `000750.00` | | | Unit-level test of `data.cob` |
