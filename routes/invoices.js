"use strict";

const db = require('../db');

const express = require("express");
const { BadRequestError } = require('../expressError');

const router = new express.Router();

// GET /invoices
// Return info on invoices: like {invoices: [{id, comp_code}, ...]}
router.get('/', async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code, amt, paid, add_date, paid_date
      FROM invoices
      ORDER BY id`
  );

  const invoices = results.rows;
  return res.json({ invoices });
});

// GET /invoices/[id]
// Returns obj on given invoice.

// If invoice cannot be found, returns 404.

// Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
router.get('/:id', async function (req, res) {
  const id = req.params.id;

  const invoiceResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date
      FROM invoices
      WHERE id = $1`,
    [id]
  );

  const companyResults = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = (
        SELECT comp_code
          FROM invoices
          WHERE id = $1
      )`, [id]
  );

  const invoice = invoiceResults.rows[0];
  const company = companyResults.rows[0];
  return res.json({ invoice: { ...invoice, company } });
});

// POST /invoices
// Adds an invoice.

// Needs to be passed in JSON body of: {comp_code, amt}

// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.post('/', async function (req, res) {
  if (!req.body) throw new BadRequestError();

  const { comp_code, amt } = req.body;
  const result = await db.query(
    `INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
  );

  const invoice = result.rows[0];
  return res.status(201).json({ invoice });
});

// PUT /invoices/[id]
// Updates an invoice.

// If invoice cannot be found, returns a 404.

// Needs to be passed in a JSON body of {amt}

// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}


// DELETE /invoices/[id]
// Deletes an invoice.

// If invoice cannot be found, returns a 404.

// Returns: {status: "deleted"}

module.exports = router;