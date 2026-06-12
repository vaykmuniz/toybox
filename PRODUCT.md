# Product

Toybox helps toy collectors keep their account, profile, uploaded collection,
and recent catch discovery in one place. The product should feel personal,
simple, and focused on the toys a user owns or may want to discover.

## Accounts

- A person can create one account with an email address, username, display name,
  and password.
- Email addresses and usernames must be unique.
- New accounts start as pending until the person verifies their email address.
- Toybox sends one verification email after account creation succeeds.
- If Toybox cannot send the verification email, the account is not created.
- A pending account cannot log in.
- A verified account can log in with its username and password.
- Verification links are valid for a limited time.
- Expired, incorrect, or already-used verification links do not verify an
  account.
- A successful login creates a bearer-token session that lets the person access
  their profile, collection, uploads, settings, and odds.
- A person can log out to remove the local session from the app.

## Collection

- Toys belong to the account that added them.
- A toy must have a name, image, and number of tries.
- Toy images are uploaded through Toybox-managed object storage before the toy is
  saved to the account collection.
- Removing an account removes the toys owned by that account.
- Toy lists should show useful visual details first, so collectors can recognize
  items quickly.
- Collection previews should show the newest uploaded toys first.

## Profile

- A profile represents the collector and their collection activity.
- Profile information should help another person understand who the collector is
  and what they collect.
- A profile shows the collector's display name, handle, avatar when present, and
  visible toy previews.
- A collector can upload or change their avatar from settings.
- Avatar images are uploaded through Toybox-managed object storage and must
  belong to the authenticated collector.
- Collection counts and visible toy previews should stay consistent with the
  toys owned by the account.

## Odds

- Odds are a discovery surface for recent toy activity.
- The current odds experience highlights recent catches from collectors,
  including toy images, names, tries, timestamps, and relevant owner context.
- Recent catches should be easy to scan and ordered from newest to oldest.
- The odds screen should still be usable when there are no recent catches, while
  data is loading, or when something cannot be reached.

## Location

- Odds help the collector understand nearby or contextual toy opportunities.
- Location is only useful when it improves the collector's experience.
- If location is unavailable, Toybox should still show a clear empty or fallback
  experience instead of blocking the rest of the app.
