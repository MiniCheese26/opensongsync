<script lang="ts">
  import { PUBLIC_SPOTIFY_CLIENT_ID } from '$env/static/public';
  import { generateRandomString } from '$lib/spotify';
  import type { Connection, Selection, SpotifySyncTracksEvent } from '$lib/sse';
  import { AUTH_URL, TIDAL_CLIENT_ID, TIDAL_CLIENT_SECRET } from '$lib/tidal';
  import { getDomain } from '$lib/utils';
  import dayjs from 'dayjs';
  import { source } from 'sveltekit-sse';

  const onSpotifyLogin = async () => {
    const state = generateRandomString(16);
    const scope = 'user-library-read user-library-modify';

    const args = new URLSearchParams({
      response_type: 'code',
      client_id: PUBLIC_SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: `${getDomain()}/api/spotify/auth`,
      state: state,
    });

    window.location.replace('https://accounts.spotify.com/authorize?' + args);
  };

  const onTidalLogin = async () => {
    const deviceCodeArgs = new URLSearchParams({
      client_id: TIDAL_CLIENT_ID,
      scope: 'r_usr+w_usr+w_sub',
    });

    const deviceCodeRes = await fetch(`${AUTH_URL}/device_authorization?${deviceCodeArgs}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const deviceCodeBody = await deviceCodeRes.json();

    if (deviceCodeRes.ok) {
      window.open(`https://${deviceCodeBody.verificationUriComplete}`, '_blank')?.focus();
    } else {
      return;
    }

    // return

    const start = dayjs();

    let data = null;

    const authCheckArgs = new URLSearchParams({
      client_id: TIDAL_CLIENT_ID,
      device_code: deviceCodeBody.deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      scope: 'r_usr+w_usr+w_sub',
    });

    const authCheckHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(TIDAL_CLIENT_ID + ':' + TIDAL_CLIENT_SECRET),
    };

    while (dayjs().diff(start, 'seconds') <= deviceCodeBody.expiresIn) {
      const authCheckRes = await fetch(`${AUTH_URL}/token?${authCheckArgs}`, {
        method: 'POST',
        headers: authCheckHeaders,
      });

      if (authCheckRes.ok) {
        const authCheckBody = await authCheckRes.json();

        data = {
          accessToken: authCheckBody.access_token,
          refreshToken: authCheckBody.refresh_token,
          userId: authCheckBody.user.userId,
          expiresAt: authCheckBody.expires_in,
          countryCode: authCheckBody.user.countryCode,
        };
        break;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, deviceCodeBody.interval * 1000);
      });
    }

    if (data) {
      const saveConnectionRes = await fetch('api/tidal/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    }

    console.debug('done');
  };

  let connection: Connection | undefined;
  let errors: Selection | undefined;
  let progress: Selection | undefined;
  let syncing = false;
  $: progressParsed = $progress ? (JSON.parse($progress) as SpotifySyncTracksEvent) : undefined;

  const syncSpotifyTracks = async () => {
    connection = source('api/spotify/syncTracks');
    syncing = true;
    errors = connection.select('spotify:syncTracks:error');
    progress = connection.select('spotify:syncTracks:progress');
  };

  const onCancel = () => {
    if (connection) {
      connection.close();
    }
  };

  const syncTidalTracks = async () => {
    const r = await fetch('api/tidal/syncTracks');
    console.debug(await r.json());
  };
</script>

<button on:click={onSpotifyLogin}>Login to spotify</button>
<button on:click={onTidalLogin}>Login to tidal</button>
<button on:click={syncSpotifyTracks}>Sync spotify tracks</button>
<button on:click={syncTidalTracks}>Sync tidal tracks</button>
{#if syncing}
  <button on:click={onCancel}>cancel</button>
{/if}
<code>
  errors - {$errors}
</code>
{#if progressParsed}
{progressParsed.page} / {progressParsed.totalPages}
{/if}
