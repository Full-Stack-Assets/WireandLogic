import { describe, it, expect } from 'vitest';
import { isPrivateIpAddress, isSafeUrlCandidate } from './research';

describe('isPrivateIpAddress', () => {
  it('blocks private/loopback IPv4 ranges', () => {
    expect(isPrivateIpAddress('10.0.0.1')).toBe(true);
    expect(isPrivateIpAddress('127.0.0.1')).toBe(true);
    expect(isPrivateIpAddress('192.168.1.1')).toBe(true);
    expect(isPrivateIpAddress('172.16.0.5')).toBe(true);
  });

  it('allows public IPv4 addresses', () => {
    expect(isPrivateIpAddress('1.1.1.1')).toBe(false);
    expect(isPrivateIpAddress('8.8.8.8')).toBe(false);
  });

  it('blocks loopback and local IPv6 ranges', () => {
    expect(isPrivateIpAddress('::1')).toBe(true);
    expect(isPrivateIpAddress('fc00::1')).toBe(true);
    expect(isPrivateIpAddress('fd12:3456:789a::1')).toBe(true);
    expect(isPrivateIpAddress('fe80::1')).toBe(true);
  });
});

describe('isSafeUrlCandidate', () => {
  it('rejects non-http(s) protocols and credentialed URLs', () => {
    expect(isSafeUrlCandidate('file:///etc/passwd')).toBe(false);
    expect(isSafeUrlCandidate('gopher://example.com')).toBe(false);
    expect(isSafeUrlCandidate('https://user@evil.example')).toBe(false);
  });

  it('rejects localhost and private IP hosts', () => {
    expect(isSafeUrlCandidate('http://localhost:3000')).toBe(false);
    expect(isSafeUrlCandidate('http://127.0.0.1/admin')).toBe(false);
    expect(isSafeUrlCandidate('http://192.168.0.10')).toBe(false);
  });

  it('accepts public http(s) URL candidates', () => {
    expect(isSafeUrlCandidate('https://example.com/article')).toBe(true);
    expect(isSafeUrlCandidate('http://8.8.8.8/status')).toBe(true);
  });
});
