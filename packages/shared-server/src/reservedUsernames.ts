// this file can be placed in /shared, but there are no reason to expose this to the public

const RESERVED_USERNAME_PARTIALS = ['admin', 'streamist'] as const;

const RESERVED_USERNAME_SET: ReadonlySet<string> = new Set([
  // based on https://github.com/shouldbee/reserved-usernames
  '0',
  '100',
  '101',
  '102',
  '1xx',
  '200',
  '201',
  '202',
  '203',
  '204',
  '205',
  '206',
  '207',
  '226',
  '2xx',
  '300',
  '301',
  '302',
  '303',
  '304',
  '305',
  '307',
  '308',
  '3xx',
  '400',
  '401',
  '402',
  '403',
  '404',
  '405',
  '406',
  '407',
  '408',
  '409',
  '410',
  '411',
  '412',
  '413',
  '414',
  '415',
  '416',
  '417',
  '418',
  '422',
  '423',
  '424',
  '426',
  '428',
  '429',
  '431',
  '451',
  '4xx',
  '500',
  '501',
  '502',
  '503',
  '504',
  '505',
  '506',
  '507',
  '511',
  '5xx',
  '7xx',
  'about',
  'abuse',
  'access',
  'account',
  'accounts',
  'activate',
  'activities',
  'activity',
  'ad',
  'add',
  'address',
  'adm',
  'admin',
  'administration',
  'administrator',
  'administrators',
  'ads',
  'adult',
  'advertising',
  'affiliate',
  'affiliates',
  'ajax',
  'all',
  'alpha',
  'analysis',
  'analytics',
  'android',
  'anon',
  'anonymous',
  'api',
  'app',
  'apps',
  'archive',
  'archives',
  'article',
  'asct',
  'asset',
  'assets',
  'atom',
  'auth',
  'authentication',
  'authorization',
  'autoconfig',
  'avatar',
  'backup',
  'balancer-manager',
  'bank',
  'banks',
  'banner',
  'banners',
  'beta',
  'billing',
  'bin',
  'blog',
  'blogs',
  'board',
  'boards',
  'book',
  'bookmark',
  'bookmarks',
  'books',
  'bot',
  'bots',
  'broadcasthost',
  'bug',
  'bugs',
  'business',
  'cache',
  'caches',
  'cadastro',
  'calendar',
  'calendars',
  'call',
  'campaign',
  'campaigns',
  'cancel',
  'captcha',
  'career',
  'careers',
  'cart',
  'carts',
  'categories',
  'category',
  'cdn-cgi',
  'cgi',
  'cgi-bin',
  'changelog',
  'changelogs',
  'chat',
  'chats',
  'check',
  'checkin',
  'checking',
  'checkins',
  'checkout',
  'checkouts',
  'checks',
  'client',
  'cliente',
  'clients',
  'code',
  'codereview',
  'codereviews',
  'codes',
  'comercial',
  'comment',
  'comments',
  'communities',
  'community',
  'companies',
  'company',
  'compare',
  'compras',
  'config',
  'configs',
  'configuration',
  'configurations',
  'connect',
  'connects',
  'contact',
  'contact_us',
  'contact-us',
  'contacts',
  'contactus',
  'contest',
  'contests',
  'contribute',
  'contributer',
  'contributers',
  'contributes',
  'corp',
  'corporation',
  'corporations',
  'create',
  'creates',
  'crypt',
  'css',
  'dashboard',
  'dashboards',
  'data',
  'database',
  'databases',
  'db',
  'default',
  'delete',
  'demo',
  'design',
  'designer',
  'designers',
  'designs',
  'destroy',
  'dev',
  'devel',
  'develop',
  'developer',
  'developers',
  'develops',
  'diagram',
  'diaries',
  'diary',
  'dict',
  'dictionaries',
  'dictionary',
  'die',
  'dir',
  'direct_message',
  'direct_messages',
  'direct-message',
  'direct-messages',
  'directmessage',
  'directmessages',
  'directories',
  'directory',
  'dist',
  'dm',
  'dns',
  'doc',
  'docker',
  'docs',
  'documentation',
  'documentations',
  'domain',
  'domains',
  'download',
  'downloads',
  'ecommerce',
  'edit',
  'editor',
  'editors',
  'edits',
  'edu',
  'education',
  'educations',
  'email',
  'emails',
  'employee',
  'employees',
  'employer',
  'employers',
  'employment',
  'employments',
  'empty',
  'end',
  'enterprise',
  'enterprises',
  'entries',
  'entry',
  'error',
  'errors',
  'eval',
  'event',
  'events',
  'everyone',
  'exit',
  'exits',
  'explore',
  'explores',
  'export',
  'exports',
  'facebook',
  'faq',
  'favorite',
  'favorites',
  'fbi',
  'feature',
  'features',
  'feed',
  'feedback',
  'feedbacks',
  'feeds',
  'file',
  'files',
  'firewall',
  'firewalls',
  'first',
  'flash',
  'fleet',
  'fleets',
  'flog',
  'follow',
  'follower',
  'followers',
  'following',
  'follows',
  'forget',
  'forget_password',
  'forget-password',
  'forgetpassword',
  'forgot',
  'forgot_password',
  'forgot-password',
  'forgotpassword',
  'form',
  'forms',
  'forum',
  'forums',
  'founder',
  'founders',
  'free',
  'friend',
  'friends',
  'ftp',
  'gadget',
  'gadgets',
  'game',
  'games',
  'get',
  'gets',
  'ghost',
  'ghosts',
  'gift',
  'gifts',
  'gist',
  'gists',
  'git',
  'github',
  'graph',
  'group',
  'groups',
  'guest',
  'guests',
  'help',
  'home',
  'homepage',
  'hook',
  'hooks',
  'host',
  'hosting',
  'hostmaster',
  'hostname',
  'hostnames',
  'hosts',
  'howto',
  'hpg',
  'html',
  'http',
  'httpd',
  'https',
  'i',
  'icon',
  'icons',
  'id',
  'idea',
  'ideas',
  'ids',
  'image',
  'images',
  'imap',
  'img',
  'index',
  'indexes',
  'indices',
  'info',
  'information',
  'infrastructure',
  'infrastructures',
  'inquiries',
  'inquiry',
  'instagram',
  'intra',
  'intranet',
  'intranets',
  'intranetwork',
  'intranetworks',
  'intras',
  'invitation',
  'invitations',
  'invite',
  'invites',
  'ip',
  'ip_address',
  'ip_addresses',
  'ip-address',
  'ip-addresses',
  'ipad',
  'ipaddress',
  'ipaddresses',
  'iphone',
  'ips',
  'irc',
  'is',
  'isatap',
  'issue',
  'issues',
  'it',
  'item',
  'items',
  'java',
  'javascript',
  'job',
  'jobs',
  'join',
  'joins',
  'js',
  'json',
  'jump',
  'jumps',
  'key',
  'keys',
  'keyserver',
  'keyservers',
  'knowledge_base',
  'knowledge-base',
  'knowledgebase',
  'language',
  'languages',
  'last',
  'ldap-status',
  'legal',
  'license',
  'licenses',
  'link',
  'links',
  'linux',
  'list',
  'lists',
  'local',
  'localdomain',
  'localhost',
  'log',
  'log',
  'log_in',
  'log_out',
  'log-in',
  'log-out',
  'login',
  'logout',
  'logs',
  'm',
  'mac',
  'mail',
  'mail0',
  'mail1',
  'mail10',
  'mail2',
  'mail3',
  'mail4',
  'mail5',
  'mail6',
  'mail7',
  'mail8',
  'mail9',
  'mailer',
  'mailer_daemon',
  'mailer-daemon',
  'mailers',
  'mailing',
  'maintenance',
  'manager',
  'managers',
  'manual',
  'manuals',
  'map',
  'maps',
  'marketing',
  'marketings',
  'master',
  'masters',
  'me',
  'media',
  'medium',
  'member',
  'members',
  'message',
  'messages',
  'messenger',
  'messengers',
  'microblog',
  'microblogs',
  'mine',
  'mis',
  'mob',
  'mobile',
  'movie',
  'movies',
  'mp3',
  'msg',
  'msn',
  'music',
  'musicas',
  'mx',
  'my',
  'mysql',
  'name',
  'named',
  'names',
  'namespace',
  'namespaces',
  'nan',
  'navi',
  'navigate',
  'navigates',
  'navigation',
  'navigations',
  'net',
  'nets',
  'network',
  'networks',
  'new',
  'news',
  'newsletter',
  'newsletters',
  'nick',
  'nickname',
  'nicknames',
  'no-reply',
  'nobody',
  'noc',
  'noreply',
  'note',
  'notes',
  'noticias',
  'notification',
  'notifications',
  'notify',
  'ns',
  'ns0',
  'ns1',
  'ns10',
  'ns2',
  'ns3',
  'ns4',
  'ns5',
  'ns6',
  'ns7',
  'ns8',
  'ns9',
  'null',
  'oauth',
  'oauth_clients',
  'oauth-clients',
  'offer',
  'offers',
  'official',
  'ogp',
  'old',
  'online',
  'openid',
  'operator',
  'operators',
  'ops',
  'order',
  'orders',
  'organization',
  'organizations',
  'orgs',
  'overview',
  'overviews',
  'owner',
  'owners',
  'package',
  'packages',
  'page',
  'pager',
  'pages',
  'panel',
  'panels',
  'passwd',
  'password',
  'passwords',
  'patch',
  'patches',
  'payment',
  'payments',
  'perl',
  'phone',
  'photo',
  'photoalbum',
  'photos',
  'php',
  'phpmyadmin',
  'phppgadmin',
  'phpredisadmin',
  'pic',
  'pics',
  'ping',
  'plan',
  'plans',
  'plugin',
  'plugins',
  'pm',
  'policies',
  'policy',
  'pop',
  'pop3',
  'popular',
  'populars',
  'portal',
  'portals',
  'post',
  'postfix',
  'postmaster',
  'posts',
  'pr',
  'preference',
  'preferences',
  'premium',
  'press',
  'price',
  'pricing',
  'privacy',
  'privacy_policy',
  'privacy-policy',
  'privacypolicy',
  'private',
  'private_message',
  'private_messages',
  'private-message',
  'private-messages',
  'privatemessage',
  'privatemessages',
  'pro',
  'product',
  'products',
  'profile',
  'profiles',
  'project',
  'projects',
  'promo',
  'pub',
  'public',
  'publics',
  'purpose',
  'purposes',
  'put',
  'puts',
  'pw',
  'python',
  'queries',
  'query',
  'random',
  'ranking',
  'read',
  'readme',
  'recent',
  'recents',
  'recruit',
  'recruitment',
  'recruitments',
  'recruits',
  'register',
  'registers',
  'registration',
  'registrations',
  'release',
  'releases',
  'remote',
  'remotes',
  'remove',
  'removes',
  'replies',
  'reply',
  'report',
  'reports',
  'repositories',
  'repository',
  'req',
  'request',
  'requests',
  'res',
  'reset',
  'reset_password',
  'reset-password',
  'resetpassword',
  'resource',
  'resources',
  'roc',
  'root',
  'rss',
  'ruby',
  'rule',
  'rules',
  'sag',
  'sale',
  'sales',
  'sample',
  'samples',
  'save',
  'saves',
  'school',
  'script',
  'scripts',
  'search',
  'searches',
  'secure',
  'secures',
  'security',
  'self',
  'send',
  'server',
  'server_info',
  'server_status',
  'server-info',
  'server-status',
  'serverinfo',
  'servers',
  'serverstatus',
  'service',
  'services',
  'session',
  'sessions',
  'setting',
  'settings',
  'setup',
  'share',
  'shares',
  'shop',
  'shops',
  'show',
  'sign_in',
  'sign_up',
  'sign-in',
  'sign-up',
  'signin',
  'signout',
  'signup',
  'site',
  'sitemap',
  'sites',
  'smartphone',
  'smtp',
  'soporte',
  'source',
  'sources',
  'spec',
  'special',
  'specs',
  'sql',
  'src',
  'ssh',
  'ssl',
  'ssladmin',
  'ssladministrator',
  'sslwebmaster',
  'staff',
  'staffs',
  'stage',
  'stages',
  'staging',
  'start',
  'stat',
  'state',
  'static',
  'stats',
  'status',
  'statuses',
  'store',
  'stores',
  'stories',
  'style',
  'styleguide',
  'styles',
  'stylesheet',
  'stylesheets',
  'subdomain',
  'subdomains',
  'subscribe',
  'subscribes',
  'subscription',
  'subscriptions',
  'suporte',
  'support',
  'supports',
  'svn',
  'swf',
  'sys',
  'sysadmin',
  'sysadministrator',
  'system',
  'systems',
  'tablet',
  'tablets',
  'tag',
  'tags',
  'talk',
  'talks',
  'task',
  'tasks',
  'team',
  'teams',
  'tech',
  'telnet',
  'term',
  'terms',
  'terms_of_service',
  'terms-of-service',
  'termsofservice',
  'test',
  'test0',
  'test1',
  'test10',
  'test2',
  'test3',
  'test4',
  'test5',
  'test6',
  'test7',
  'test8',
  'test9',
  'teste',
  'testing',
  'tests',
  'theme',
  'themes',
  'thread',
  'threads',
  'tls',
  'tmp',
  'todo',
  'todos',
  'token',
  'token_server',
  'token_servers',
  'token-server',
  'token-servers',
  'tokens',
  'tokenserver',
  'tokenservers',
  'tool',
  'tools',
  'top',
  'topic',
  'topics',
  'tos',
  'tour',
  'tours',
  'translation',
  'translations',
  'trend',
  'trends',
  'tutorial',
  'tutorials',
  'tux',
  'tv',
  'twitter',
  'undef',
  'unfollow',
  'unsubscribe',
  'update',
  'updates',
  'upgrade',
  'upgrades',
  'upload',
  'uploads',
  'uptime',
  'url',
  'usage',
  'usages',
  'usenet',
  'user',
  'username',
  'usernames',
  'users',
  'usr',
  'usuario',
  'util',
  'utils',
  'uucp',
  'vendas',
  'vendor',
  'vendors',
  'ver',
  'vers',
  'version',
  'versions',
  'video',
  'videos',
  'visitor',
  'visitors',
  'vpn',
  'watch',
  'watches',
  'weather',
  'weathers',
  'web',
  'webhook',
  'webhooks',
  'webmail',
  'webmaster',
  'website',
  'websites',
  'welcome',
  'widget',
  'widgets',
  'wiki',
  'win',
  'windows',
  'word',
  'work',
  'works',
  'workshop',
  'wpad',
  'ww',
  'wws',
  'www',
  'www0',
  'www1',
  'www10',
  'www2',
  'www3',
  'www4',
  'www5',
  'www6',
  'www7',
  'www8',
  'www9',
  'wwws',
  'wwww',
  'xfn',
  'xml',
  'xmpp',
  'xpg',
  'xxx',
  'yaml',
  'year',
  'yml',
  'you',
  'yourdomain',
  'yourname',
  'yoursite',
  'yourusername',
]);

export function isReservedUsername(username: string): boolean {
  const lowerUsername = username.toLowerCase();
  return (
    RESERVED_USERNAME_SET.has(lowerUsername) ||
    RESERVED_USERNAME_PARTIALS.some((p) => lowerUsername.includes(p))
  );
}
