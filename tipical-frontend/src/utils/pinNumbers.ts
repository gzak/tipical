const pinNumbers = new Map<string, number>();

export function getPinNumber(googlePlaceId: string): number {
  let pinNumber = pinNumbers.get(googlePlaceId);
  if (pinNumber === undefined) {
    pinNumber = pinNumbers.size + 1;
    pinNumbers.set(googlePlaceId, pinNumber);
  }
  return pinNumber;
}
