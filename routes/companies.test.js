'use strict';

const request = require('supertest');

const app = require('../app');
let db = require('../db');


let testCompany1;
let testCompany2;

let [invoice1, invoice2] = [null, null];

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  const companyResults = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.')
    RETURNING code, name, description`);
  testCompany1 = companyResults.rows[0];
  testCompany2 = companyResults.rows[1];


  await db.query("DELETE FROM invoices");
  const invoiceResults = await db.query(`
    INSERT INTO invoices (comp_code, amt, paid, paid_date)
    VALUES ('apple', 100, FALSE, NULL),
       ('apple', 200, FALSE, NULL),
       ('apple', 300, TRUE, '2018-01-01'),
       ('ibm', 400, FALSE, NULL);
  `);
  invoice1 = invoiceResults[0];
  invoice2 = invoiceResults[2];
});


afterAll(async () => {
  await db.end();
});


describe("get companies", function () {

  test("get a list of all companies", async function () {
    const resp = await request(app).get('/companies');

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ companies: [testCompany1, testCompany2] });

  });

  test("get details of a single company", async function () {
    const resp = await request(app).get('/companies/ibm');

    const invoiceId = resp.body.company.invoices[0].id;

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      "company": {
        "code": "ibm",
        "name": "IBM",
        "description": "Big blue.",
        "invoices": [{ "id": invoiceId }]
      }
    });
  });

});

describe("Post request tests", function () {

  test("Post request success", async function () {
    const newCompany = {
      'code': 'AND',
      'name': 'android',
      'description': 'new company test'
    };
    const resp = await request(app)
      .post('/companies')
      .send(newCompany);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ company: newCompany });
  });

  test("Post request failure: incomplete data", async function () {
    const incompleteCompany = {
      'name': 'not a full company'
    };

    const resp = await request(app)
      .post('/companies')
      .send(incompleteCompany);

    expect(resp.statusCode).toEqual(500);
  });

  test("Post request failure: no req.body", async function () {
    const resp = await request(app)
      .post('/companies')
      .send();

    expect(resp.statusCode).toEqual(400);
  });
});

describe('PUT /companies/:code', function () {
  test('update single company', async function () {
    const resp = await request(app)
      .put('/companies/apple')
      .send({
        "code": "meta",
        "name": "Meta",
        "description": "Facebook.",
      });

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      "company": {
        "code": "apple",
        "name": "Meta",
        "description": "Facebook.",
      }
    });
  });
});

describe("delete request tests", function () {

  test("successful delete", async function () {
    const resp = await request(app).delete("/companies/ibm");

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ message: "deleted" });
  });

  test("unsuccessful delete: company not found", async function () {
    const resp = await request(app).delete("/companies/notacompany");

    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({
      "error": {
        "message": "Not Found",
        "status": 404,
      }
    });
  });

});