/**
 *
 *    Copyright (c) 2020 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 *
 * @jest-environment node
 */

import { processCommandLineArguments } from '../src-electron/main-process/args'
import yargs from 'yargs'

test('Test basic command line processing', () => {
  var args = processCommandLineArguments([
    'node',
    'test.js',
    '--noUI',
    '--httpPort',
    '123',
    '--arglessArg',
    '--xmlRoot',
    'XmlRoot',
  ])

  expect(args.noUI).toBeTruthy()
  expect(args.httpPort).toBeTruthy()
  expect(args.httpPort).toEqual(123)
  expect(args.arglessArg).toBeTruthy()
  expect(args.xmlRoot).toBe('XmlRoot')
})

test('Verify how yargs works', () => {
  var argv = yargs(['a', '--x', 1, 'b', '--y', 2, '--tst', 42]).parse()
  expect(argv._).toContain('a')
  expect(argv._).toContain('b')
  expect(argv.x).toBe(1)
  expect(argv.y).toBe(2)
  expect(argv.tst).toBe(42)
})
