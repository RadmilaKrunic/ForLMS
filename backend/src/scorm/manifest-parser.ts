import { parseStringPromise } from 'xml2js';
import { BadRequestException } from '@nestjs/common';

export interface ParsedManifest {
  identifier: string;
  scormVersion: string;
  entryPoint: string;
}

/**
 * Parses imsmanifest.xml and extracts what the LMS needs to launch the
 * package: the manifest identifier, declared SCORM schema version, and the
 * entry-point HTML file (href of the resource referenced by the first item
 * in the default organization). Validates SCORM 1.2 compliance (ELR_CNT_001
 * / ELR_CNT_006 / ELR_LMS_003).
 */
export async function parseManifest(xml: string): Promise<ParsedManifest> {
  let parsed: any;
  try {
    parsed = await parseStringPromise(xml, { explicitArray: true });
  } catch {
    throw new BadRequestException('imsmanifest.xml is not valid XML');
  }

  const manifest = parsed?.manifest;
  if (!manifest) {
    throw new BadRequestException('imsmanifest.xml missing root <manifest> element');
  }

  const identifier = manifest.$?.identifier;
  if (!identifier) {
    throw new BadRequestException('imsmanifest.xml manifest is missing an identifier');
  }

  const schemaVersion = manifest.metadata?.[0]?.schemaversion?.[0];
  const scormVersion = normalizeScormVersion(schemaVersion);
  if (scormVersion !== '1.2') {
    throw new BadRequestException(
      `Package declares SCORM schema version "${schemaVersion ?? 'unknown'}" — only SCORM 1.2 packages are accepted (ELR_CNT_001).`,
    );
  }

  const organizations = manifest.organizations?.[0];
  const defaultOrgId = organizations?.$?.default;
  const orgList = organizations?.organization ?? [];
  const org = orgList.find((o: any) => o.$?.identifier === defaultOrgId) ?? orgList[0];
  const firstItem = org?.item?.[0];
  const resourceId = firstItem?.$?.identifierref;

  const resources = manifest.resources?.[0]?.resource ?? [];
  const resource = resources.find((r: any) => r.$?.identifier === resourceId) ?? resources[0];
  const entryPoint = resource?.$?.href;

  if (!entryPoint) {
    throw new BadRequestException('Could not resolve a launchable entry point (href) from imsmanifest.xml');
  }

  return { identifier, scormVersion, entryPoint };
}

function normalizeScormVersion(schemaVersion?: string): string {
  if (!schemaVersion) return 'unknown';
  if (schemaVersion.includes('1.2')) return '1.2';
  if (schemaVersion.toUpperCase().includes('2004')) return '2004';
  return schemaVersion;
}
