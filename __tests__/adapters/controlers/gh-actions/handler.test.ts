import {Handler} from '../../../../src/adapters/controlrels/gh-actions/handler'
import exp = require('constants')

describe('handler', () => {
  describe('getInputBoolean', () => {
    const handler = new Handler()
    test.each`
      inputValue   | defaultValue | expectValue  | requiredError | invalidError
      ${'true'}    | ${undefined} | ${true}      | ${false}      | ${false}
      ${'false'}   | ${undefined} | ${false}     | ${false}      | ${false}
      ${'rue'}     | ${undefined} | ${undefined} | ${false}      | ${true}
      ${'1'}       | ${undefined} | ${undefined} | ${false}      | ${true}
      ${'0'}       | ${undefined} | ${undefined} | ${false}      | ${true}
      ${undefined} | ${undefined} | ${undefined} | ${true}       | ${false}
      ${'true'}    | ${false}     | ${true}      | ${false}      | ${false}
      ${'false'}   | ${false}     | ${false}     | ${false}      | ${false}
      ${'True'}    | ${false}     | ${true}      | ${false}      | ${false}
      ${'TRUE'}    | ${false}     | ${true}      | ${false}      | ${false}
      ${'False'}   | ${false}     | ${false}     | ${false}      | ${false}
      ${'FALSE'}   | ${false}     | ${false}     | ${false}      | ${false}
      ${undefined} | ${true}      | ${true}      | ${false}      | ${false}
      ${undefined} | ${false}     | ${false}     | ${false}      | ${false}
    `(
      'returns $expectValue when paramName is $paramName and default is $defaultValue or throws error. requiredError: $requiredError, invalidError: $invalidError',
      ({
        inputValue,
        defaultValue,
        expectValue,
        requiredError,
        invalidError
      }) => {
        try {
          const res = handler.getInputBoolean('testparameter', defaultValue, {
            getInput: () => inputValue
          })
          if (requiredError || invalidError) {
            fail()
          }
          expect(res).toEqual(expectValue)
        } catch (e) {
          if (requiredError) {
            expect(e).toBeInstanceOf(Error)
            expect(e.message).toEqual(`testparameter is required.`)
          } else if (invalidError) {
            expect(e).toBeInstanceOf(Error)
            expect(e.message).toEqual(
              `testparameter should be true/false. input: ${inputValue}`
            )
          } else {
            fail()
          }
        }
      }
    )
  })
})
