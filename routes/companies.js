"use strict";
const db = require('../db');

const express = require("express");
const { BadRequestError, NotFoundError } = require('../expressError');
const { response } = require('../app');

const router = new express.Router();

/**
 * Returns list of companies like {companies: [{code, name}, ...]}
 */
router.get('/', async function (req, res) {
  const results = await db.query(`
    SELECT code, name, description FROM
    companies
    ORDER BY code
  `);

  const companies = results.rows;
  return res.json({ companies });
});

/**
 * Returns object of company: {company: {code, name, description}} or 404
 */
router.get('/:code', async function (req, res) {
  const code = req.params.code;
  const companyResults = await db.query(`
    SELECT code, name, description FROM companies
    WHERE code = $1`, [code]
  );

  const invoiceResults = await db.query(
    `SELECT id
      FROM invoices
      WHERE comp_code = $1`,
    [code]
  );

  const company = companyResults.rows[0];

  if (!company) throw new NotFoundError("Did not find company code");

  company.invoices = invoiceResults.rows;
  return res.json({ company });
});


/**
 * Adds a company. Requires JSON of {code, name, description},
 * returns obj of new company: {company: {code, name, description}}
 */
router.post('/', async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  const { code, name, description } = req.body;
  const response = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ($1, $2, $3)
    RETURNING code, name, description`, [code, name, description]
  );


  const company = response.rows[0];
  // if (!company) throw new BadRequestError("company data insufficient, need primary key");
  return res.status(201).json({ company });
});


/**
 * Edit existing company. Requires {name, description} in body, returns 404 if not
 * found, or the updated company object.
 */


router.put('/:code', async function (req, res) {
  if (!req.body) throw new BadRequestError();

  const { name, description } = req.body;

  const response = await db.query(`
    UPDATE companies
    SET name=$1,
      description=$2
      WHERE code= $3
      RETURNING code, name, description`,
    [name, description, req.params.code]);

  const company = response.rows[0];

  if (!company) throw new NotFoundError();
  return res.json({ company });
});


/**
 *  Deletes company. Returns 404 if company cannot be found.
 */
router.delete('/:code', async function (req, res) {

  const response = await db.query(`DELETE FROM companies WHERE code = $1`,
    [req.params.code]);

  if (!response.rowCount) throw new NotFoundError();
  return res.json({ message: 'deleted' });
});

module.exports = router;