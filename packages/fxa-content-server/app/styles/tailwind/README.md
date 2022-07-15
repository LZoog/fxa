# Tailwind in fxa-content-server

current as of 2022-07-20

FxA's front-ends either use Tailwind or will be using Tailwind in near the future. We plan to convert the content-server over to a similar stack to `fxa-settings`, which includes React and Tailwind.

To make the stack conversion easier and to get a head start on making FxA's styles consistent, any design tweaks in the content-server should reference Tailwind classes if at all possible. This should be done with care.

If you're adding Tailwind styles:

- Be sure to inspect the elements and make sure only Tailwind styles (utility classes preferably) are applied as much as possible. You’ll have to remove some old SCSS targeted with selectors or else they’ll override your utility classes but do so carefully and be sure to refactor other mustache files that would match those selectors.
- At the time of writing, `tailwind.out.css` was only added to content-server’s primary `index.html` file. If/when we reskin the error pages or `privacy.html` we'll need to include it there too.

Component classes should live in this `tailwind` directory for organization purposes but when we can ditch the old SCSS files, we can move these styles out of this directory. **Don't use SCSS in component class files** because while we have to keep the build step at the moment for old SCSS files, we'll want to remove it later, and we can use `postcss-import` and `tailwind/nesting` which uses `postcss-nested` under the hood instead. Only use `@apply [tailwind-classes]` in component classes if possible.
