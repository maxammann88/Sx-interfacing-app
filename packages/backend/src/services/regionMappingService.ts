import prisma from '../prismaClient';

export interface RegionInfo {
  regionName: string;
  countryCount: number;
  countries?: string[];
}

export class RegionMappingService {
  /**
   * Validates country codes:
   * - Must be exactly 2 characters
   * - Must not exist in any other region (currently active)
   * - Must not contain duplicates within the same list
   */
  async validateCountryCodes(
    regionName: string,
    countryCodes: string[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check format (2 characters)
    const invalidFormat = countryCodes.filter(code => code.length !== 2);
    if (invalidFormat.length > 0) {
      errors.push(`Invalid format (must be 2 characters): ${invalidFormat.join(', ')}`);
    }

    // Check for duplicates within the same list
    const lowerCodes = countryCodes.map(c => c.toLowerCase());
    const codeCount = new Map<string, number>();
    for (const code of lowerCodes) {
      codeCount.set(code, (codeCount.get(code) || 0) + 1);
    }
    
    const internalDuplicates = Array.from(codeCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([code, count]) => `${code.toUpperCase()} (${count} times)`);
    
    if (internalDuplicates.length > 0) {
      errors.push(`Duplicate countries in the same list: ${internalDuplicates.join(', ')}`);
    }

    // Check for duplicates across all regions
    const allActiveCountries = await (prisma as any).regionCountryMapping.findMany({
      where: {
        validTo: null,
        regionName: { not: regionName }, // Exclude the current region
      },
      select: {
        countryCode: true,
        regionName: true,
      },
    });

    const existingMap = new Map<string, string>();
    for (const mapping of allActiveCountries) {
      existingMap.set(mapping.countryCode, mapping.regionName);
    }

    const duplicates: string[] = [];
    for (const code of countryCodes) {
      const lowerCode = code.toLowerCase();
      if (existingMap.has(lowerCode)) {
        duplicates.push(`${code.toUpperCase()} (already in ${existingMap.get(lowerCode)})`);
      }
    }

    if (duplicates.length > 0) {
      errors.push(`Countries already assigned to other regions: ${duplicates.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async saveMapping(
    regionName: string,
    countryCodes: string[],
    validFrom: Date,
    validTo: Date | null,
    createdBy: string = 'System',
    notes?: string
  ): Promise<void> {
    console.log('regionMappingService.saveMapping called with:', {
      regionName,
      countryCodesCount: countryCodes.length,
      validFrom: validFrom.toISOString(),
      validTo: validTo?.toISOString() || 'null',
      createdBy,
      notes: notes || 'none'
    });

    // Validate country codes
    const validation = await this.validateCountryCodes(regionName, countryCodes);
    if (!validation.valid) {
      throw new Error(validation.errors.join('; '));
    }

    // Get all current mappings for this region (validTo = null)
    const existingMappings = await (prisma as any).regionCountryMapping.findMany({
      where: {
        regionName,
        validTo: null,
      },
    });

    const existingCodes = new Set(existingMappings.map((m: any) => m.countryCode));
    const newCodes = new Set(countryCodes.map(c => c.toLowerCase()));
    
    // Check if the validFrom date has changed (more than 1 minute difference)
    const validFromChanged = existingMappings.length > 0 && 
      Math.abs(new Date(existingMappings[0].validFrom).getTime() - validFrom.getTime()) > 60000;

    // Check if anything changed
    const hasChanges = 
      existingCodes.size !== newCodes.size ||
      [...existingCodes].some(code => !newCodes.has(code)) ||
      [...newCodes].some(code => !existingCodes.has(code)) ||
      !!notes ||
      validFromChanged;

    if (!hasChanges) {
      console.log('No changes detected, skipping save');
      // Nothing changed
      return;
    }
    
    console.log('Changes detected:', {
      countriesChanged: existingCodes.size !== newCodes.size || 
        [...existingCodes].some(code => !newCodes.has(code)) ||
        [...newCodes].some(code => !existingCodes.has(code)),
      notesAdded: !!notes,
      validFromChanged: validFromChanged
    });

    // Use a slightly earlier timestamp for closing old mappings
    // to avoid conflicts with the new validFrom
    const closeDate = new Date(validFrom.getTime() - 1);
    
    console.log('Closing existing mappings with validTo:', closeDate.toISOString());

    // Close ALL existing mappings with the earlier timestamp
    await (prisma as any).regionCountryMapping.updateMany({
      where: {
        regionName,
        validTo: null,
      },
      data: { validTo: closeDate },
    });

    // Create new mappings for ALL countries in the new list
    // No need to delete - the validFrom is guaranteed to be unique
    const mappingData = countryCodes.map(countryCode => ({
      regionName,
      countryCode,
      validFrom,
      validTo,
      createdBy,
      notes: notes || null,
    }));

    console.log('Creating new mappings with validFrom:', validFrom.toISOString(), 'for', mappingData.length, 'countries');

    await (prisma as any).regionCountryMapping.createMany({
      data: mappingData,
    });
    
    console.log('Save completed successfully');
  }

  async getRegionForCountry(countryCode: string, date: Date = new Date()): Promise<string | null> {
    const mapping = await (prisma as any).regionCountryMapping.findFirst({
      where: {
        countryCode,
        validFrom: { lte: date },
        OR: [
          { validTo: null },
          { validTo: { gte: date } },
        ],
      },
      orderBy: { validFrom: 'desc' },
    });

    return mapping ? mapping.regionName : null;
  }

  async getCountriesInRegion(regionName: string, date?: Date): Promise<string[]> {
    const effectiveDate = date || new Date();

    const mappings = await (prisma as any).regionCountryMapping.findMany({
      where: {
        regionName,
        validFrom: { lte: effectiveDate },
        OR: [
          { validTo: null },
          { validTo: { gte: effectiveDate } },
        ],
      },
      select: { countryCode: true },
    });

    return mappings.map((m: any) => m.countryCode);
  }

  async getAllRegions(date?: Date): Promise<RegionInfo[]> {
    const effectiveDate = date || new Date();
    
    console.log('getAllRegions called with effectiveDate:', effectiveDate.toISOString());

    // Get all mappings that are valid at the effective date
    const allMappings = await (prisma as any).regionCountryMapping.findMany({
      where: {
        validFrom: { lte: effectiveDate },
        OR: [
          { validTo: null },
          { validTo: { gte: effectiveDate } },
        ],
      },
      select: {
        regionName: true,
        countryCode: true,
        validFrom: true,
        validTo: true,
        createdAt: true,
      },
    });
    
    console.log(`Found ${allMappings.length} mappings valid at ${effectiveDate.toISOString()}`);

    // Group by region:country and pick the NEWEST (by validFrom) version
    const grouped = new Map<string, any[]>();
    
    for (const mapping of allMappings) {
      const key = `${mapping.regionName}:${mapping.countryCode}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(mapping);
    }

    const regionMap = new Map<string, Set<string>>();
    
    for (const [key, versions] of grouped.entries()) {
      // Sort by validFrom DESC (newest first)
      versions.sort((a, b) => 
        new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime()
      );
      
      const newestVersion = versions[0];
      
      if (!regionMap.has(newestVersion.regionName)) {
        regionMap.set(newestVersion.regionName, new Set());
      }
      regionMap.get(newestVersion.regionName)!.add(newestVersion.countryCode);
    }

    const result = Array.from(regionMap.entries()).map(([regionName, countries]) => ({
      regionName,
      countryCount: countries.size,
      countries: Array.from(countries),
    }));
    
    console.log('Regions result:', result.map(r => `${r.regionName}: ${r.countryCount} countries`).join(', '));

    return result;
  }

  async getRegionMappingAtDate(date: Date): Promise<Map<string, string>> {
    const mappings = await (prisma as any).regionCountryMapping.findMany({
      where: {
        validFrom: { lte: date },
        OR: [
          { validTo: null },
          { validTo: { gte: date } },
        ],
      },
      select: {
        countryCode: true,
        regionName: true,
      },
    });

    const map = new Map<string, string>();
    for (const mapping of mappings) {
      map.set(mapping.countryCode.toLowerCase(), mapping.regionName);
    }

    return map;
  }

  async deleteRegionMapping(regionName: string, date: Date = new Date()): Promise<void> {
    await (prisma as any).regionCountryMapping.updateMany({
      where: {
        regionName,
        validTo: null,
      },
      data: {
        validTo: date,
      },
    });
  }
}

export const regionMappingService = new RegionMappingService();
