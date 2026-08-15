import {
  getAddress,
  getBytes,
  hexlify,
  keccak256,
  zeroPadValue,
} from "ethers";

export function immutableReferenceRanges(immutableReferences = {}) {
  const ranges = Object.entries(immutableReferences)
    .flatMap(([sourceId, references]) => references.map(({ start, length }) => ({
      sourceId,
      start: Number(start),
      length: Number(length),
    })))
    .sort((left, right) => left.start - right.start || left.length - right.length);

  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index];
    if (!Number.isSafeInteger(range.start) || !Number.isSafeInteger(range.length)
      || range.start < 0 || range.length <= 0) {
      throw new Error("INVALID_IMMUTABLE_REFERENCE_RANGE");
    }
    if (index > 0) {
      const previous = ranges[index - 1];
      if (range.start < previous.start + previous.length) {
        throw new Error("OVERLAPPING_IMMUTABLE_REFERENCE_RANGES");
      }
    }
  }
  return ranges;
}

function checkedRuntimeBytes(bytecode, ranges) {
  const bytes = Uint8Array.from(getBytes(bytecode));
  for (const { start, length } of ranges) {
    if (start + length > bytes.length) throw new Error("IMMUTABLE_REFERENCE_OUT_OF_BOUNDS");
  }
  return bytes;
}

export function patchUupsSelfAddress(runtimeTemplate, immutableReferences, implementationAddress) {
  const ranges = immutableReferenceRanges(immutableReferences);
  if (ranges.length === 0) throw new Error("UUPS_SELF_IMMUTABLE_REFERENCE_REQUIRED");
  const bytes = checkedRuntimeBytes(runtimeTemplate, ranges);
  const address = getAddress(implementationAddress);

  for (const { start, length } of ranges) {
    if (length !== 32) throw new Error("UNEXPECTED_UUPS_SELF_IMMUTABLE_LENGTH");
    bytes.set(getBytes(zeroPadValue(address, length)), start);
  }
  return hexlify(bytes);
}

export function normalizeImmutableReferences(runtimeBytecode, immutableReferences) {
  const ranges = immutableReferenceRanges(immutableReferences);
  const bytes = checkedRuntimeBytes(runtimeBytecode, ranges);
  for (const { start, length } of ranges) bytes.fill(0, start, start + length);
  return hexlify(bytes);
}

export function verifyUupsRuntime({ artifact, deployedRuntime, implementationAddress }) {
  const ranges = immutableReferenceRanges(artifact.immutableReferences);
  const artifactBytes = getBytes(artifact.deployedBytecode).length;
  const deployedBytes = getBytes(deployedRuntime).length;
  if (ranges.length === 0) {
    return {
      status: "FAIL",
      reason: "UUPS_SELF_IMMUTABLE_REFERENCE_REQUIRED",
      artifactBytes,
      deployedBytes,
      immutableReferences: ranges,
    };
  }
  if (artifactBytes !== deployedBytes) {
    return {
      status: "FAIL",
      reason: "RUNTIME_LENGTH_MISMATCH",
      artifactBytes,
      deployedBytes,
      immutableReferences: ranges,
    };
  }

  const patchedExpectedRuntime = patchUupsSelfAddress(
    artifact.deployedBytecode,
    artifact.immutableReferences,
    implementationAddress,
  );
  const normalizedArtifact = normalizeImmutableReferences(
    artifact.deployedBytecode,
    artifact.immutableReferences,
  );
  const normalizedDeployed = normalizeImmutableReferences(
    deployedRuntime,
    artifact.immutableReferences,
  );
  const patchedRuntimeMatch = patchedExpectedRuntime.toLowerCase() === deployedRuntime.toLowerCase();
  const normalizedRuntimeMatch = normalizedArtifact === normalizedDeployed;

  return {
    status: patchedRuntimeMatch && normalizedRuntimeMatch ? "PASS" : "FAIL",
    reason: patchedRuntimeMatch && normalizedRuntimeMatch ? null : "DEPLOYED_RUNTIME_MISMATCH",
    artifactBytes,
    deployedBytes,
    immutableReferences: ranges,
    rawArtifactRuntimeHash: keccak256(artifact.deployedBytecode),
    patchedExpectedRuntimeHash: keccak256(patchedExpectedRuntime),
    actualRuntimeHash: keccak256(deployedRuntime),
    normalizedArtifactRuntimeHash: keccak256(normalizedArtifact),
    normalizedActualRuntimeHash: keccak256(normalizedDeployed),
    patchedRuntimeMatch,
    normalizedRuntimeMatch,
  };
}
