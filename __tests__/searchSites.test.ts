// __tests__/searchSites.test.ts
import { searchSites } from '../src/services/siteService';

describe('searchSites', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ features: [] }),
    });
  });

  it('returns [] for very short queries', async () => {
    const out = await searchSites('a');
    expect(out).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('strips wildcard characters from user input', async () => {
    await searchSites('Tara%_');
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).not.toMatch(/%25/); // no encoded % survives
    expect(url).not.toMatch(/_/);
    expect(url).toContain('TARA');
  });

  it("escapes single quotes", async () => {
    await searchSites("O'Brien");
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain("O%27%27BRIEN");
  });

  it('caps the limit', async () => {
    await searchSites('Tara', 9999);
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('resultRecordCount=50');
  });
});
