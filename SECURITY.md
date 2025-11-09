# Security Policy

## INC-022: npm Security Vulnerability Remediation

### Vulnerability Summary

This document records the security assessment and remediation for vulnerabilities identified in npm audit.

### 1. Vite Path Traversal Vulnerability (RESOLVED)

- **CVE**: GHSA-93m4-6634-74q7
- **Severity**: Moderate
- **Affected Version**: 7.1.0 - 7.1.10
- **Issue**: Windows environment path traversal via backslash bypass of server.fs.deny
- **Resolution**: Upgraded to vite ^7.2.2
- **Status**: FIXED
- **Date Resolved**: 2025-11-09

### 2. markdown-it-katex XSS Vulnerability (RISK ACCEPTED)

- **CVE**: GHSA-5ff8-jcf9-fw62
- **Severity**: High
- **Affected Version**: All versions (>=0.0.0)
- **Issue**: Cross-Site Scripting (XSS) vulnerability in markdown-it-katex
- **Status**: RISK ACCEPTED WITH MITIGATION
- **Decision Date**: 2025-11-09

#### Risk Assessment

**Attack Vector Analysis**:
- Content source: Static markdown files in `/public/lectures/*` directory
- Content control: All lecture content is developer-controlled and version-controlled
- User input: NO user-generated content is processed through markdown-it-katex
- Exploit scenario: Requires compromising source repository and injecting malicious content

**Impact Evaluation**:
- Likelihood: LOW (requires repository compromise)
- Impact: HIGH (if exploited, could execute arbitrary JavaScript)
- Overall Risk: MEDIUM-LOW

#### Mitigation Strategy

**Primary Controls**:
1. **Source Control**: All lecture markdown files are version-controlled in Git
2. **Code Review**: Changes to lecture content undergo review process
3. **Content Validation**: Lecture files loaded from trusted static paths only

**Defense in Depth**:
1. **Content Security Policy**: Implemented CSP meta tag in index.html
   - Restricts script sources to same-origin
   - Limits external resource loading
2. **KaTeX Configuration**:
   - `throwOnError: false` prevents rendering failures
   - `errorColor: #cc0000` provides visual feedback for invalid formulas

**Alternative Solutions Evaluated**:

| Solution | Assessment | Decision |
|----------|------------|----------|
| **markdown-it-texmath** | Last updated 2022, similar maintenance status as markdown-it-katex | Not adopted |
| **Complete removal** | Would break all mathematical formula rendering in lectures | Not viable |
| **Custom sanitization** | High complexity, potential to break LaTeX syntax | Deferred |
| **Risk acceptance + controls** | Balances security with functionality | SELECTED |

#### Monitoring and Review

- **Next Review**: 2026-01-09 (quarterly)
- **Trigger for Re-evaluation**:
  - markdown-it-katex releases security patch
  - Introduction of user-generated content features
  - Security audit findings
  - Alternative packages with active maintenance emerge

#### Compensating Controls Checklist

- [x] Content Security Policy implemented
- [x] Source code documented with security notes
- [x] Risk assessment documented in SECURITY.md
- [x] All lecture content version-controlled
- [x] No user-generated content processed through vulnerable component

### Vulnerability Metrics

**Before Remediation**:
- High: 1 (markdown-it-katex XSS)
- Moderate: 1 (vite path traversal)
- Total: 2

**After Remediation**:
- High: 1 (markdown-it-katex XSS - risk accepted)
- Moderate: 0
- Total: 1 (with documented mitigation)

### References

- [GHSA-93m4-6634-74q7](https://github.com/advisories/GHSA-93m4-6634-74q7) - Vite Path Traversal
- [GHSA-5ff8-jcf9-fw62](https://github.com/advisories/GHSA-5ff8-jcf9-fw62) - markdown-it-katex XSS

### Reporting Security Issues

If you discover a security vulnerability in this project, please email the maintainers or open a security advisory on GitHub.
