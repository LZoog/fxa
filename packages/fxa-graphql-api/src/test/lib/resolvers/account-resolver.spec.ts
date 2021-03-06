/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import 'mocha';
import 'reflect-metadata';

import { assert } from 'chai';
import { graphql, GraphQLSchema } from 'graphql';
import Knex from 'knex';
import sinon from 'ts-sinon';
import { buildSchema } from 'type-graphql';

import { Account } from '../../../lib/db/models';
import { AccountResolver } from '../../../lib/resolvers/account-resolver';
import { randomAccount, testDatabaseSetup } from '../db/models/auth/helpers';
import { mockContext } from '../mocks';

const sandbox = sinon.createSandbox();

const USER_1 = randomAccount();
const USER_2 = randomAccount();

describe('accountResolver', () => {
  let knex: Knex;
  let schema: GraphQLSchema;
  let context: ReturnType<typeof mockContext>;

  before(async () => {
    knex = await testDatabaseSetup();
    // Load the users in
    await (Account as any).query().insertGraph({ ...USER_1 });
    schema = await buildSchema({
      resolvers: [AccountResolver],
    });
  });

  beforeEach(async () => {
    context = mockContext();
  });

  after(async () => {
    await knex.destroy();
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('query', () => {
    describe('account', () => {
      it('locates the user by uid', async () => {
        const query = `query {
          account {
            uid
            accountCreated
          }
        }`;
        context.authUser = USER_1.uid;
        const result = (await graphql(
          schema,
          query,
          undefined,
          context
        )) as any;
        assert.isDefined(result.data);
        assert.isDefined(result.data.account);
        assert.deepEqual(result.data.account, {
          accountCreated: USER_1.createdAt,
          uid: USER_1.uid,
        });
        assert.isTrue((context.logger.info as sinon.SinonSpy).calledOnce);
      });

      it('does not locate non-existent users by uid', async () => {
        const query = `query {
          account {
            uid
          }
        }`;
        context.authUser = USER_2.uid;
        const result = (await graphql(
          schema,
          query,
          undefined,
          context
        )) as any;
        assert.isDefined(result.data);
        assert.isNull(result.data.account);
        assert.isTrue((context.logger.info as sinon.SinonSpy).calledOnce);
      });
    });
  });

  describe('mutation', () => {
    describe('updateDisplayName', () => {
      it('succeeds', async () => {
        context.dataSources.profileAPI.updateDisplayName.resolves(true);
        const query = `mutation {
          updateDisplayName(input: {clientMutationId: "testid", displayName: "fred"}) {
            clientMutationId
            displayName
          }
        }`;
        context.authUser = USER_1.uid;
        const result = (await graphql(
          schema,
          query,
          undefined,
          context
        )) as any;
        assert.isDefined(result.data);
        assert.isDefined(result.data.updateDisplayName);
        assert.deepEqual(result.data.updateDisplayName, {
          clientMutationId: 'testid',
          displayName: 'fred',
        });
      });
    });

    describe('updateAvatar', async () => {
      // Due to the interactions required between express middleware and
      // the apollo server, no unit testing of the update avatar is feasible.
      // FIXME: Integrated test that verifies file upload functionality.
    });

    describe('createSecondaryEmail', async () => {
      it('succeeds', async () => {
        context.dataSources.authAPI.recoveryEmailCreate.resolves(true);
        const query = `mutation {
          createSecondaryEmail(input: {clientMutationId: "testid", email: "test@example.com"}) {
            clientMutationId
          }
        }`;
        context.authUser = USER_1.uid;
        const result = (await graphql(
          schema,
          query,
          undefined,
          context
        )) as any;
        assert.isDefined(result.data);
        assert.isDefined(result.data.createSecondaryEmail);
        assert.deepEqual(result.data.createSecondaryEmail, {
          clientMutationId: 'testid',
        });
      });
    });

    describe('deleteSecondaryEmail', async () => {
      it('succeeds', async () => {
        context.dataSources.authAPI.recoveryEmailDestroy.resolves(true);
        const query = `mutation {
          deleteSecondaryEmail(input: {clientMutationId: "testid", email: "test@example.com"}) {
            clientMutationId
          }
        }`;
        context.authUser = USER_1.uid;
        const result = (await graphql(
          schema,
          query,
          undefined,
          context
        )) as any;
        assert.isDefined(result.data);
        assert.isDefined(result.data.deleteSecondaryEmail);
        assert.deepEqual(result.data.deleteSecondaryEmail, {
          clientMutationId: 'testid',
        });
      });
    });

    describe('updatePrimaryEmail', async () => {
      it('succeeds', async () => {
        context.dataSources.authAPI.recoveryEmailSetPrimaryEmail.resolves(true);
        const query = `mutation {
          updatePrimaryEmail(input: {clientMutationId: "testid", email: "test@example.com"}) {
            clientMutationId
          }
        }`;
        context.authUser = USER_1.uid;
        const result = (await graphql(
          schema,
          query,
          undefined,
          context
        )) as any;
        assert.isDefined(result.data);
        assert.isDefined(result.data.updatePrimaryEmail);
        assert.deepEqual(result.data.updatePrimaryEmail, {
          clientMutationId: 'testid',
        });
      });
    });

    describe('resendSecondaryEmailCode', async () => {
      it('succeeds', async () => {
        context.dataSources.authAPI.recoveryEmailSecondaryResendCode.resolves(
          true
        );
        const query = `mutation {
          resendSecondaryEmailCode(input: {clientMutationId: "testid", email: "test@example.com"}) {
            clientMutationId
          }
        }`;
        context.authUser = USER_1.uid;
        const result = (await graphql(
          schema,
          query,
          undefined,
          context
        )) as any;
        assert.isDefined(result.data);
        assert.isDefined(result.data.resendSecondaryEmailCode);
        assert.deepEqual(result.data.resendSecondaryEmailCode, {
          clientMutationId: 'testid',
        });
      });
    });
  });
});
