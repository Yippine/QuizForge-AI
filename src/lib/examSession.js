/**
 * examSession — lightweight singleton to pass exam results between ExamPage → ExamResultPage.
 * Not persisted; cleared after reading.
 */

let _result = null

export function setExamResult(result) {
  _result = result
}

export function getExamResult() {
  return _result
}

export function clearExamResult() {
  _result = null
}
