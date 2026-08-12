import { describe, it, expect } from 'vitest';
import { createPinnedLookup, isPrivateIpAddress, isSafeUrlCandidate } from './research';

describe('isPrivateIpAddress', () => {
  it('blocks private, loopback, link-local, CGNAT, benchmark, documentation, multicast, and reserved IPv4 ranges', () => {
    for (const address of [
      '0.0.0.0',
      '10.0.0.1',
      '127.0.0.1',
      '100.64.0.0',
      '100.127.255.255',
      '169.254.1.1',
      '172.16.0.5',
      '192.0.0.1',
      '192.0.2.1',
      '192.88.99.1',
      '192.168.1.1',
      '198.18.0.1',
      '198.51.100.1',
      '203.0.113.1',
      '224.0.0.1',
      '255.255.255.255',
    ]) {
      expect(isPrivateIpAddress(address)).toBe(true);
    }
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

  it('blocks local, transition, documentation, site-local, multicast, and mapped-private IPv6 ranges', () => {
    for (const address of [
      '::',
      '::1',
      '0:0:0:0:0:0:0:1',
      '::127.0.0.1',
      '::ffff:10.0.0.1',
      '::ffff:a00:1',
      '64:ff9b::a00:1',
      '64:ff9b:1::1',
      '100::1',
      '2001:2::1',
      '2001:db8::1',
      '2002:a00:1::1',
      '3fff::1',
      '5f00::1',
      'fc00::1',
      'fd12:3456:789a::1',
      'fe80::1',
      'fec0::1',
      'ff02::1',
    ]) {
      expect(isPrivateIpAddress(address)).toBe(true);
    }
  });

  it('allows mapped and native public IPv6 addresses', () => {
    expect(isPrivateIpAddress('::ffff:8.8.8.8')).toBe(false);
    expect(isPrivateIpAddress('::ffff:808:808')).toBe(false);
    expect(isPrivateIpAddress('2606:4700:4700::1111')).toBe(false);
  });
});

describe('createPinnedLookup', () => {
  it('returns the scalar callback form when all is false', () => {
    const calls: unknown[][] = [];
    createPinnedLookup('8.8.8.8', 4)(
      'example.com',
      { all: false },
      (...args: unknown[]) => calls.push(args)
    );
    expect(calls).toEqual([[null, '8.8.8.8', 4]]);
  });

  it('returns an address array when Node requests all results', () => {
    const calls: unknown[][] = [];
    createPinnedLookup('2606:4700:4700::1111', 6)(
      'example.com',
      { all: true },
      (...args: unknown[]) => calls.push(args)
    );
    expect(calls).toEqual([[null, [{ address: '2606:4700:4700::1111', family: 6 }]]]);
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

  it('rejects local, special-use, mapped, and encoded IP hosts', () => {
    for (const url of [
      'http://localhost:3000',
      'http://foo.local',
      'http://service.internal',
      'http://127.0.0.1/admin',
      'http://192.168.0.10',
      'http://100.64.0.10',
      'http://198.18.0.1',
      'http://203.0.113.1',
      'http://[::]/',
      'http://[::1]/',
      'http://[::ffff:10.0.0.1]/',
      'http://[2001:db8::1]/',
      'http://[ff02::1]/',
      'http://2130706433/',
      'http://0x7f000001/',
      'http://0177.0.0.1/',
      'http://127.1/',
    ]) {
      expect(isSafeUrlCandidate(url)).toBe(false);
    }
  });

  it('accepts public http(s) URL candidates', () => {
    expect(isSafeUrlCandidate('https://example.com/article')).toBe(true);
    expect(isSafeUrlCandidate('http://8.8.8.8/status')).toBe(true);
    expect(isSafeUrlCandidate('http://[2606:4700:4700::1111]/')).toBe(true);
    expect(isSafeUrlCandidate('http://[::ffff:8.8.8.8]/')).toBe(true);
  });
});
