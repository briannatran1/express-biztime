"use strict";

const db = require('../db');

const express = require("express");
const { BadRequestError, NotFoundError } = require('../expressError');

const router = new express.Router();

//TODO: add more lines for docstrings => more vertical
//TODO: less information for many things, more for fewer things; return only code and name

/** GET /invoices: Return info on invoices: like {invoices: [{id, comp_code}, ...]} */
router.get('/', async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code, amt, paid, add_date, paid_date
      FROM invoices
      ORDER BY id`
  );

  //TODO: group code together space between 23 and 24

  const invoices = results.rows;
  return res.json({ invoices });
});

/** GET /invoices/:id: returns an invoice obj like {invoice: {id, amt, paid, add_date, paid_date,
 * company: {code, name, description}}
 * or 404 error */
router.get('/:id', async function (req, res) {
  const id = req.params.id;

  const invoiceResults = await db.query(
    `SELECT id, comp_code, amt, paid, add_date, paid_date
      FROM invoices
      WHERE id = $1`,
    [id]
  );
  const invoice = invoiceResults.rows[0];

  if (!invoice) throw new NotFoundError();

  const companyResults = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`,
    [invoice.comp_code]
  );

  // subquery way:
  //
  // const companyResults = await db.query(
  //   `SELECT code, name, description
  //     FROM companies
  //     WHERE code = (
  //       SELECT comp_code
  //         FROM invoices
  //         WHERE id = $1
  //     )`, [id]
  // );

  const company = companyResults.rows[0];
  invoice.company = company;

  return res.json({ invoice });

  // return res.json({ invoice: { ...invoice, company } });
});

/** POST /invoices: creates a new invoice by passing in { comp_code, amt }
 *  Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

//TODO: group thoughts together
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

/** PUT /invoices/:id: updates an existing invoice by passing {amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} OR
 * returns a 404 if no invoice is found */
router.put('/:id', async function (req, res) {
  if (!req.body) throw new BadRequestError();

  const { amt } = req.body;
  const result = await db.query(
    `UPDATE invoices
      SET amt=$1
      WHERE id = $2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,

    //TODO: make var for req.param.id
    [amt, req.params.id]
  );

  const invoice = result.rows[0];
  return res.json({ invoice });
});

/** DELETE /invoices/:id: deletes and invoice and returns {status: "deleted"}
 * or returns a 404 error if invoice cannot be found
*/
router.delete('/:id', async function (req, res) {
  const result = await db.query(
    `DELETE FROM invoices
      WHERE id = $1`,
    [req.params.id]);

  if (!result.rowCount) throw new NotFoundError();

  return res.json({ status: 'deleted' });
});

module.exports = router;