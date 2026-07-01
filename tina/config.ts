import { defineConfig } from 'tinacms';
import { siteConfig } from '../src/site.config';

// Tina v2 config. Run `npm run dev` to start the editor at /admin/index.html.
// For self-hosted mode (no Tina Cloud), leave clientId/token blank and Tina
// will use the local filesystem directly.
const isCloudEnabled = !!(process.env.NEXT_PUBLIC_TINA_CLIENT_ID && process.env.TINA_TOKEN);

export default defineConfig({
  branch: process.env.GITHUB_BRANCH ?? 'main',
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,

  // Skip client SDK generation when running in self-hosted mode
  client: {
    skip: !isCloudEnabled,
  },

  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: 'uploads',
      publicFolder: 'public',
    },
  },

  schema: {
    collections: [
      {
        name: 'post',
        label: 'Posts',
        path: 'content/posts',
        format: 'mdx',
        ui: {
          router: ({ document }) => `/blog/${document._sys.filename}`,
        },
        fields: [
          { name: 'title', label: 'Title', type: 'string', required: true, isTitle: true },
          { name: 'description', label: 'Description', type: 'string', required: true, ui: { component: 'textarea' } },
          { name: 'date', label: 'Date', type: 'datetime', required: true },
          {
            name: 'category',
            label: 'Category',
            type: 'string',
            required: true,
            // Derived from siteConfig.categories so the editor dropdown, the
            // writer prompt, and the schema stay in sync (one source of truth).
            options: siteConfig.categories.map((c) => ({
              value: c,
              label: c.length <= 3 ? c.toUpperCase() : c[0].toUpperCase() + c.slice(1),
            })),
          },
          { name: 'tags', label: 'Tags', type: 'string', list: true },
          {
            name: 'hero',
            label: 'Hero image',
            type: 'object',
            fields: [
              { name: 'url', label: 'URL', type: 'string' },
              { name: 'alt', label: 'Alt text', type: 'string' },
              { name: 'credit', label: 'Credit', type: 'string' },
              { name: 'creditUrl', label: 'Credit URL', type: 'string' },
            ],
          },
          {
            name: 'sources',
            label: 'Sources',
            type: 'object',
            list: true,
            fields: [
              { name: 'title', label: 'Title', type: 'string' },
              { name: 'url', label: 'URL', type: 'string' },
            ],
          },
          {
            name: 'body',
            label: 'Body',
            type: 'rich-text',
            isBody: true,
            templates: [
              {
                name: 'Callout',
                label: 'Callout',
                fields: [
                  {
                    name: 'type',
                    label: 'Type',
                    type: 'string',
                    options: ['takeaway', 'warning', 'note'],
                  },
                ],
              },
              { name: 'ProsCons', label: 'Pros/Cons block', fields: [{ name: '_placeholder', label: '-', type: 'string' }] },
              { name: 'Pros', label: 'Pros', fields: [{ name: '_placeholder', label: '-', type: 'string' }] },
              { name: 'Cons', label: 'Cons', fields: [{ name: '_placeholder', label: '-', type: 'string' }] },
              { name: 'FAQ', label: 'FAQ', fields: [{ name: '_placeholder', label: '-', type: 'string' }] },
              {
                name: 'Question',
                label: 'Question',
                fields: [{ name: 'q', label: 'Question', type: 'string' }],
              },
            ],
          },
        ],
      },
    ],
  },
});
