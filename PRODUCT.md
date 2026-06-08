# Product

Toybox helps toy collectors keep their collection, profile, and discovery feed in
one place. The product should feel personal, simple, and focused on the toys a
user owns or may want to discover.

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

## Collection

- Toys belong to the account that added them.
- A toy can have a name and an image.
- Removing an account removes the toys owned by that account.
- Toy lists should show useful visual details first, so collectors can recognize
  items quickly.

## Feed

- The feed is a discovery surface for toys and collector activity.
- Feed items should be easy to scan and should highlight toy images, names, and
  relevant owner context.
- The feed should still be usable when there are no items, while data is loading,
  or when something cannot be reached.

## Profile

- A profile represents the collector and their collection activity.
- Profile information should help another person understand who the collector is
  and what they collect.
- Collection counts and visible toy previews should stay consistent with the
  toys owned by the account.

## Odds

- Odds help the collector understand nearby or contextual toy opportunities.
- Location is only useful when it improves the collector's experience.
- If location is unavailable, Toybox should still show a clear empty or fallback
  experience instead of blocking the rest of the app.
