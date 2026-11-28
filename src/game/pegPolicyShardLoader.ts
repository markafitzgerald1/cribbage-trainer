import { PONE, type Seat } from "./pegging";
import { type PolicyShard, parsePolicyShard } from "./pegPolicyShard";
import type { BotShardLookup } from "./botHand";

const HAND_KEY = /^[A2-9TJQK](?:_[A2-9TJQK]){3}$/u;

const fetchShard = async (
  url: string,
  signal: AbortSignal,
  retry: boolean,
): Promise<PolicyShard | null> => {
  const response = await fetch(url, {
    cache: retry ? "reload" : "default",
    signal,
  });
  if (!response.ok || response.body === null) {
    return null;
  }
  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  const payload = await new Response(stream).arrayBuffer();
  signal.throwIfAborted();
  return parsePolicyShard(new Uint8Array(payload));
};

interface ShardRequest {
  pending: Promise<PolicyShard | null> | null;
  retry: boolean;
}

/**
 * Call for each new hand with its original keep keys. Switching hands
 * invalidates the old lookup and drops both parsed shards.
 */
export const createPolicyShardLoader = (
  baseUrl = `${import.meta.env.BASE_URL}pegging-policy-shards/`,
): ((poneKey: string, dealerKey: string) => BotShardLookup) => {
  let stopPrevious: (() => void) | null = null;

  return (poneKey, dealerKey) => {
    stopPrevious?.();
    const controller = new AbortController();
    const { signal } = controller;
    const requests = new Map<Seat, ShardRequest>();
    stopPrevious = () => {
      requests.clear();
      controller.abort();
    };

    return (seat, handKey) => {
      const expectedKey = seat === PONE ? poneKey : dealerKey;
      if (
        signal.aborted ||
        handKey !== expectedKey ||
        !HAND_KEY.test(handKey) ||
        new Set(handKey.split("_")).size === 1
      ) {
        return null;
      }

      const request = requests.get(seat) ?? { pending: null, retry: false };
      requests.set(seat, request);
      const role = seat === PONE ? "pone" : "dealer";
      // Cache reload bypasses a 404 cached by Pages.
      // A failed module import would persist for the page lifetime.
      request.pending ??= fetchShard(
        `${baseUrl}${role}/${handKey}.bin.gz`,
        signal,
        request.retry,
      )
        .catch(() => null)
        .then((shard) => {
          if (signal.aborted) {
            return null;
          }
          if (shard === null) {
            request.pending = null;
            request.retry = true;
          }
          return shard;
        });
      return request.pending;
    };
  };
};
