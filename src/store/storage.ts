import { Preferences } from '@capacitor/preferences'

const PREFIX = 'mappaterritori_'

export async function loadData<T>(key: string): Promise<T | null> {
  const { value } = await Preferences.get({ key: PREFIX + key })
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export async function saveData<T>(key: string, data: T): Promise<void> {
  await Preferences.set({ key: PREFIX + key, value: JSON.stringify(data) })
}

export async function removeData(key: string): Promise<void> {
  await Preferences.remove({ key: PREFIX + key })
}
