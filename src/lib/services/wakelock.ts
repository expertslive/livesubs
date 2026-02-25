let wakeLock: WakeLockSentinel | null = null;

async function acquire() {
	try {
		wakeLock = await navigator.wakeLock.request('screen');
		wakeLock.addEventListener('release', () => {
			wakeLock = null;
		});
	} catch {
		// Wake Lock API not supported or permission denied — degrade silently
	}
}

function handleVisibilityChange() {
	if (document.visibilityState === 'visible' && !wakeLock) {
		acquire();
	}
}

export async function requestWakeLock() {
	if (!('wakeLock' in navigator)) return;
	await acquire();
	document.addEventListener('visibilitychange', handleVisibilityChange);
}

export function releaseWakeLock() {
	document.removeEventListener('visibilitychange', handleVisibilityChange);
	if (wakeLock) {
		wakeLock.release();
		wakeLock = null;
	}
}
