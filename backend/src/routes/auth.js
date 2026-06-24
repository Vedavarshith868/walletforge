const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, withTenant } = require('../db');
const { ApiError } = require('../middleware/errors');
const asyncHandler = require('../lib/asyncHandler');
const { asString, asEmail } = require('../lib/validation');

const router = express.Router();
const BCRYPT_ROUNDS = 10;

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function issueToken(user) {
  return jwt.sign({ sub: user.id, tenant: user.tenant_id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function serializeUser(user) {
  return { id: user.id, email: user.email, organizationId: user.tenant_id };
}

function serializeOrganization(organization) {
  return { id: organization.id, name: organization.name, slug: organization.slug };
}

router.post(
  '/signup-org',
  asyncHandler(async (req, res) => {
    const organizationName = asString(req.body.organizationName, 'organizationName');
    const email = asEmail(req.body.email, 'email');
    const password = asString(req.body.password, 'password');
    const slug = req.body.slug ? slugify(asString(req.body.slug, 'slug')) : slugify(organizationName);
    if (!slug) {
      throw new ApiError(400, 'invalid_request', 'Could not derive a slug from the organization name');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const client = await pool.connect();
    try {
      await client.query('begin');

      let organization;
      try {
        organization = (
          await client.query('insert into organizations (name, slug) values ($1, $2) returning *', [
            organizationName,
            slug,
          ])
        ).rows[0];
      } catch (error) {
        if (error.code === '23505') {
          throw new ApiError(409, 'organization_exists', 'An organization with this slug already exists');
        }
        throw error;
      }

      await client.query("select set_config('app.tenant_id', $1, true)", [organization.id]);
      const user = (
        await client.query('insert into users (tenant_id, email, password_hash) values ($1, $2, $3) returning *', [
          organization.id,
          email,
          passwordHash,
        ])
      ).rows[0];
      await client.query(
        "insert into audit_log (tenant_id, event_type, event_data) values ($1, 'organization.created', $2)",
        [organization.id, { organization_id: organization.id, slug: organization.slug }]
      );

      await client.query('commit');
      res.status(201).json({
        token: issueToken(user),
        organization: serializeOrganization(organization),
        user: serializeUser(user),
      });
    } catch (error) {
      await client.query('rollback').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  })
);

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const slug = slugify(asString(req.body.slug, 'slug'));
    const email = asEmail(req.body.email, 'email');
    const password = asString(req.body.password, 'password');

    const organization = (await pool.query('select * from organizations where slug = $1', [slug])).rows[0];
    if (!organization) {
      throw new ApiError(404, 'organization_not_found', 'No organization exists with that slug');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await withTenant(organization.id, async (client) => {
      let created;
      try {
        created = (
          await client.query('insert into users (tenant_id, email, password_hash) values ($1, $2, $3) returning *', [
            organization.id,
            email,
            passwordHash,
          ])
        ).rows[0];
      } catch (error) {
        if (error.code === '23505') {
          throw new ApiError(409, 'user_exists', 'A user with this email already exists in the organization');
        }
        throw error;
      }
      await client.query(
        "insert into audit_log (tenant_id, event_type, event_data) values ($1, 'user.created', $2)",
        [organization.id, { user_id: created.id }]
      );
      return created;
    });

    res.status(201).json({
      token: issueToken(user),
      organization: serializeOrganization(organization),
      user: serializeUser(user),
    });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const slug = slugify(asString(req.body.slug, 'slug'));
    const email = asEmail(req.body.email, 'email');
    const password = asString(req.body.password, 'password');

    const organization = (await pool.query('select * from organizations where slug = $1', [slug])).rows[0];
    if (!organization) {
      throw new ApiError(401, 'invalid_credentials', 'Invalid credentials');
    }

    const user = await withTenant(organization.id, (client) =>
      client.query('select * from users where email = $1', [email]).then((result) => result.rows[0])
    );
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new ApiError(401, 'invalid_credentials', 'Invalid credentials');
    }

    res.json({
      token: issueToken(user),
      organization: serializeOrganization(organization),
      user: serializeUser(user),
    });
  })
);

module.exports = router;
