import { describe, it, expect } from 'vitest';
import { createPinnedLookup, isPrivateIpAddress, isSafeUrlCandidate } from './research';

describe('isPrivateIpAddress', () => {
  it('blocks private, loopback, link-local, CGNAT, and reserved IPv4 ranges', () => {
    expect(isPrivateIpAddress('0.0.0.0')).toBe(true);
    expect(isPrivateIpAddress('10.0.0.1')).toBe(true);
    expect(isPrivateIpAddress('127.0.0.1')).toBe(true);
    expect(isPrivateIpAddress('100.64.0.0')).toBe(true);
    expect(isPrivateIpAddress('100.64.0.1')).toBe(true);
    expect(isPrivateIpAddress('100.127.255.254')).toBe(true);
    expect(isPrivateIpAddress('100.127.255.255')).toBe(true);
    expect(isPrivateIpAddress('169.254.1.1')).toBe(true);
    expect(isPrivateIpAddress('172.16.0.5')).toBe(true);
    expect(isPrivateIpAddress('192.168.1.1')).toBe(true);
    expect(isPrivateIpAddress('224.0.0.1')).toBe(true);
  });

  it('allows public IPv4 addresses immediately outside CGNAT and common public resolvers', () => {
    expect(isPrivateIpAddress('1.1.1.1')).toBe(false);
    expect(isPrivateIpAddress('8.8.8.8')).toBe(false);
    expect(isPrivateIpAddress('100.63.255.255')).toBe(false);
    expect(isPrivateIpAddress('100.128.0.0')).toBe(false);
  });

  it('fails closed for malformed addresses', () => {
    expect(isPrivateIpAddress('')).toBe(true);
    expect(isPrivateIpAddress('999.1.1.1')).toBe(true);
    expect(isPrivateIpAddress('not-an-ip')).toBe(true);
  });

  it('blocks loopback, unspecified, local, link-local, and mapped IPv6 ranges', () => {
    expect(isPrivateIpAddress('::')).toBe(true);
    expect(isPrivateIpAddress('::1')).toBe(true);
    expect(isPrivateIpAddress('0:0:0:0:0:0:0:1')).toBe(true);
    expect(isPrivateIpAddress('fc00::1')).toBe(true);
    expect(isPrivateIpAddress('fd12:3456:789a::1')).toBe(true);
    expect(isPrivateIpAddress('fe80::1')).toBe(true);
    expect(isPrivateIpAddress('::ffff:10.0.0.1')).toBe(true);
    expect(isPrivateIpAddress('::ffff:a00:1')).toBe(true);
    expect(isPrivateIpAddress('::ffff:7f00:1')).toBe(true);
  });

  it('allows mapped public IPv4 addresses', () => {
    expect(isPrivateIpAddress('::ffff:8.8.8.8')).toBe(false);
    expect(isPrivateIpAddress('::ffff:808:808')).toBe(false);
  });
});

describe('createPinnedLookup', () => {
  it('returns the scalar callback form when all is false', () => {
    const calls: unknown[][] = [];
    createPinnedLookup('203.0.113.10', 4)(
      'example.com',
      { all: false },
      (...args) => calls.push(args)
    );
    expect(calls).toEqual([[null, '203.0.113.10', 4]]);
  });

  it('returns an address array when Node requests all results', () => {
    const calls: unknown[][] = [];
    createPinnedLookup('2001:db8::10', 6)(
      'example.com',
      { all: true },
      (...args) => calls.push(args)
    );
    expect(calls).toEqual([[null, [{ address: '2001:db8::10', family: 6 }]]]);
  });
});

describe('isSafeUrlCandidate', () => {
  it('rejects malformed URLs, non-http(s) protocols, and credentialed URLs', () => {
    expect(isSafeUrlCandidate('')).toBe(false);
    expect(isSafeUrlCandidate('not a url')).toBe(false);
    expect(isSafeUrlCandidate('http://[::1')).toBe(false);
    expect(isSafeUrlCandidate('file:///etc/passwd')).toBe(false);
    expect(isSafeUrlCandidate('gopher://example.com')).toBe(false);
    expect(isSafeUrlCandidate('https://user@evil.example')).toBe(false);
    expect(isSafeUrlCandidate('https://user:pass@evil.example')).toBe(false);
  });

  it('rejects localhost, private, CGNAT, bracketed, mapped, and encoded IP hosts', () => {
    expect(isSafeUrlCandidate('http://localhost:3000')).toBe(false);
    expect(isSafeUrlCandidate('http://foo.local')).toBe(false);
    expect(isSafeUrlCandidate('http://service.internal')).toBe(false);
    expect(isSafeUrlCandidate('http://127.0.0.1/admin')).toBe(false);
    expect(isSafeUrlCandidate('http://192.168.0.10')).toBe(false);
    expect(isSafeUrlCandidate('http://100.64.0.10')).toBe(false);
    expect(isSafeUrlCandidate('http://[::]/')).toBe(false);
    expect(isSafeUrlCandidate('http://[::1]/')).toBe(false);
    expect(isSafeUrlCandidate('http://[0:0:0:0:0:0:0:1]/')).toBe(false);
    expect(isSafeUrlCandidate('http://[::ffff:10.0.0.1]/')).toBe(false);
    expect(isSafeUrlCandidate('http://[::ffff:a00:1]/')).toBe(false);

    // WHATWG URL canonicalizes these legacy IPv4 forms to 127.0.0.1.
    expect(isSafeUrlCandidate('http://2130706433/')).toBe(false);
    expect(isSafeUrlCandidate('http://0x7f000001/')).toBe(false);
    expect(isSafeUrlCandidate('http://0177.0.0.1/')).toBe(false);
    expect(isSafeUrlCandidate('http://127.1/')).toBe(false);
  });

  it('accepts public http(s) URL candidates', () => {
    expect(isSafeUrlCandidate('https://example.com/article')).toBe(true);
    expect(isSafeUrlCandidate('http://8.8.8.8/status')).toBe(true);
    expect(isSafeUrlCandidate('http://[2606:4700:4700::1111]/')).toBe(true);
    expect(isSafeUrlCandidate('http://[::ffff:8.8.8.8]/')).toBe(true);
  });
});
