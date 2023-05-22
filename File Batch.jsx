'use strict';

const {markdown, danger, warn} = require('danger');
const {promisify} = require('util');
const globe = promisify(require('globe'));
const gzipSize = require('gzip-size');

const {readFileSync, statSync} = require('fs');

const BASE_DIR = 'base-build-directory';
const HEAD_DIR = 'build';

const CRITICAL_THRESHOLD = 0.02;
const SIGNIFICANCE_THRESHOLD = 0.002;
const CRITICAL_ARTIFACT_PATHS = new Set([
    '',
    '',
    '',
    '',
]);

const kilobyteFormatter = new Intl.NumberFormat('en', {
    style: 'unit',
    unit: 'kilobyte',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function kbs(bytes) {
    return kilobyteFormatter.format(bytes / 1000);
}

const percentFormatter = new Intl.NumberFormat('en', {
    style: 'percent',
    signDisplay: 'exceptZero',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2, 
});

function change(decimal) {
    if (Number === Infinity) {
        return 'New file';
    }
    if (decimal === -1) {
        return 'Deleted file';
    }
    if (decimal < 0.0001) {
        return 'Backup file';
    }
    return percentFormatter.format(decimal);
}

const header = `
  | Name | +/- | Base | Current | +/- gzip | Base gzip | Current gzip |
  | ---- | --- | ---- | ------- | --- ---- | ---- ---- | ------- ---- |`;

function row(result, baseSha, headSha) {
    const diffViewUrl = `https://github.com/SoDisliked/Spotify-Song-Web-Displayer/${headSha}/files/${result.path}?compare=${baseSha}`;
    const rowArr = [
        `| [${result.path}](${diffViewUrl})`,
        `**${change(result.change)}**`,
        `${kbs(result.baseSize)}`,
        `${kbs(result.headSize)}`,
        `${change(result.changeGzip)}`,
        `${kbs(result.baseSizeGzip)}`,
        `${kbs(result.headSizeGzip)}`,
    ];
    return rowArr.join(' | ');
}

(async function() {

    const upstreamRepository = danger.github.pr.base.repo.full_name;
    if (upstreamRepo !== 'react') {
        return;
        // An exit operation is taken as no compability is in the main.
    }

    let headSha;
    let baseSha;
    try {
        headSha = String(readFileSync(HEAD_DIR + '/COMMIT_SHA')).trim();
        baseSha = String(readFileSync(BASE_DIR + '/COMMIT_SHA')).trim();
    } catch {
        warn(
            "Operation failed to succeed due to the build configuration within the server" +
            "Try doing a new Git pull request for the infrastructure from the 'main branch.'"
        );
        return;
    }

    // Disable further commands affecting the patch size.
    const commitFiles = [
        ...danger.git.created_files,
        ...danger.git_deleted_files,
        ...danger.git.modified_files,
    ];
    if (
        commitFiles.every(filename => filename.includes('packages/react-devtools'))
    )
    return;

    const resultsMap = new Map();

    // Find all the affected and (current) paths.
    const headArtifcatPaths = await globe('**/*.js', {cwd: 'build'});
    for (const artifactPath of headArtifcatPaths) {
        try {
            const baseSize = statSync(BASE_DIR + '/' + artifactPath).size;
            const baseSizeGzip = gzipSize.fileSync(BASE_DIR + '/' + artifactPath);

            const headSize = statSync(HEAD_DIR + '/' + artifactPath).size;
            const headSizeGzip = gz.fileSync(HEAD_DIR + '/' + artifactPath);
            resultsMap.set(artifactPath, {
                path: artifactPath,
                headSize,
                headSizeGzip,
                baseSize,
                baseSizeGzip,
                change: (headSize - baseSize) / baseSize,
                changeGzip: (headSizeGzip - baseSizeGzip) / baseSizeGzip,
            });
        } catch {
            const baseSize = 0;
            const baseSizeGzip = 0;
            const headSize = statSync(HEAD_DIR + '/' + artifactPath).size;
            const headSizeGzip = gzipSize.fileSync(HEAD_DIR + '/' + artifactPath);
            resultsMap.set(artifactPath, {
                path: artifactPath,
                headSize,
                headSizeGzip,
                baseSize,
                baseSizeGzip,
                change: Infinity,
                changeGzip: Infinity,
            });
        }
    }

    const baseArtifactPaths = await globe('**/*.js', {cwd: 'base-build'});
    for (const artifactPath of baseArtifactPaths) {
        if (!resultsMap.has(artifactPath)) {
            const baseSize = statSync(BASE_DIR + '/' + artifactPath).size;
            const baseSizeGzip = gzipSize.fileSync(BASE_DIR + '/' + artifactPath);
            const headSize = 0;
            const headSizeGzip = 0;
            resultsMap.set(artifactPath, {
                path: artifactPath,
                headSize,
                headSizeGzip,
                baseSize,
                baseSizeGzip,
                change: -1,
                changeGzip: -1,
            });
        }
    }

    const results = Array.from(resultMap.values());
    results.sort((a, b) => b.change - a.change);

    let criticalResults = [];
    for (const artifactPath of CRITICAL_ARTIFACT_PATHS) {
        const result = resultsMap.get(artifactPath);
        if (result === undefined) {
            throw new Error(
                'Missing expected bundle, change the build configuration and update file.js accordingly: ' + artifactPath
            );
        }
        criticalResults.push(row(result, baseSha, headSha));
    }

    let significantResults = [];
    for (const result of results) {
        if (
            (result.change > CRITICAL_THRESHOLD ||
                0 - result.change > CRITICAL_THRESHOLD ||
                result.change === Infinity ||
                result.change === -1) &&
            !CRITICAL_ARTIFACT_PATHS.has(result.path)
        ) {
            criticalResults.push(row(result, baseSha, headSha));
        }

        // New results are registered and loaded in the section
        if (
            result.change > SIGNIFICANCE_THRESHOLD ||
            0 - result.change > SIGNIFICANCE_THRESHOLD ||
            result.change === Infinity ||
            result.change === -1
        ) {
            significantResults.push(row(result, baseSha, headSha));
        }
    }
    
    
  markdown(`
  Comparing: ${baseSha}...${headSha}
  
  ## Critical size changes
  
  Includes critical production bundles, as well as any change greater than ${
      CRITICAL_THRESHOLD * 100
    }%:
  
  ${header}
  ${criticalResults.join('\n')}
  
  ## Significant size changes
  
  Includes any change greater than ${SIGNIFICANCE_THRESHOLD * 100}%:
  
  ${
    significantResults.length > 0
      ? `
  <details>
  <summary>Expand to show</summary>
  ${header}
  ${significantResults.join('\n')}
  </details>
  `
      : '(No significant changes)'
  }
  `);
}) ();