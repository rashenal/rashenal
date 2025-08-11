#!/usr/bin/env ts-node

// CLI Entry Point for Schema Validator
// This file is only for Node.js/CLI usage

import { SchemaValidator } from './schema-validator';

// Run CLI if executed directly
if (require.main === module) {
  const validator = new SchemaValidator();
  validator.runCLI().catch(console.error);
}