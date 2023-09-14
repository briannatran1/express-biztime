'use strict';

const request = require('supertest');

const app = require('../app');
let db = require('../db');


beforeEach(async function () {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
    INSERT INTO companies (name)
    VALUES ('TestCat')
    RETURNING code, name, description`);
  testCompany = result.rows[0];
});