/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import {
  GraphQLSchema,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLDirective,
  GraphQLList,
} from '../';

import { describe, it } from 'mocha';
import { expect } from 'chai';

const InterfaceType = new GraphQLInterfaceType({
  name: 'Interface',
  fields: { fieldName: { type: GraphQLString } },
});

const DirectiveInputType = new GraphQLInputObjectType({
  name: 'DirInput',
  fields: {
    field: {
      type: GraphQLString,
    },
  },
});

const WrappedDirectiveInputType = new GraphQLInputObjectType({
  name: 'WrappedDirInput',
  fields: {
    field: {
      type: GraphQLString,
    },
  },
});

const Directive = new GraphQLDirective({
  name: 'dir',
  locations: ['OBJECT'],
  args: {
    arg: {
      type: DirectiveInputType,
    },
    argList: {
      type: new GraphQLList(WrappedDirectiveInputType),
    },
  },
});

const Schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      getObject: {
        type: InterfaceType,
        resolve() {
          return {};
        },
      },
    },
  }),
  directives: [Directive],
});

describe('Type System: Schema', () => {
  describe('Type Map', () => {
    it('includes input types only used in directives', () => {
      expect(Schema.getTypeMap()).to.include.key('DirInput');
      expect(Schema.getTypeMap()).to.include.key('WrappedDirInput');
    });
  });

  describe('Validity', () => {
    describe('when not assumed valid', () => {
      it('configures the schema to still needing validation', () => {
        expect(
          new GraphQLSchema({
            assumeValid: false,
          }).__validationErrors,
        ).to.equal(undefined);
      });

      it('configures the schema for allowed legacy names', () => {
        expect(
          new GraphQLSchema({
            allowedLegacyNames: ['__badName'],
          }).__allowedLegacyNames,
        ).to.deep.equal(['__badName']);
      });

      it('checks the configuration for mistakes', () => {
        // $DisableFlowOnNegativeTest
        expect(() => new GraphQLSchema(() => null)).to.throw();
        // $DisableFlowOnNegativeTest
        expect(() => new GraphQLSchema({ types: {} })).to.throw();
        // $DisableFlowOnNegativeTest
        expect(() => new GraphQLSchema({ directives: {} })).to.throw();
        // $DisableFlowOnNegativeTest
        expect(() => new GraphQLSchema({ allowedLegacyNames: {} })).to.throw();
      });
    });

    describe('when assumed valid', () => {
      it('configures the schema to have no errors', () => {
        expect(
          new GraphQLSchema({
            assumeValid: true,
          }).__validationErrors,
        ).to.deep.equal([]);
      });

      it('still configures the schema for allowed legacy names', () => {
        expect(
          new GraphQLSchema({
            assumeValid: true,
            allowedLegacyNames: ['__badName'],
          }).__allowedLegacyNames,
        ).to.deep.equal(['__badName']);
      });

      it('does not check the configuration for mistakes', () => {
        expect(() => {
          const config = () => null;
          config.assumeValid = true;
          // $DisableFlowOnNegativeTest
          return new GraphQLSchema(config);
        }).to.not.throw();

        expect(() => {
          return new GraphQLSchema({
            assumeValid: true,
            // $DisableFlowOnNegativeTest
            types: {},
            // $DisableFlowOnNegativeTest
            directives: { reduce: () => [] },
            // $DisableFlowOnNegativeTest
            allowedLegacyNames: {},
          });
        }).to.not.throw();
      });
    });
  });
});
