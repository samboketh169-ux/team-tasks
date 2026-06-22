# កិច្ចការក្រុម — ការដំឡើង (Deploy) ជាជំហានៗ

កម្មវិធីនេះមាន៖ **Dashboard** (សង្ខេបទិន្នន័យ) + **ការងារត្រូវធ្វើ** (រំលឹកតាម Telegram) +
**កត់ត្រាការងារ** (តាមដានស្ថានភាព) + **Admin** (បង្កើត account ឱ្យក្រុមការងារ — គ្មាន public signup)។

ប្រើ៖ Next.js (Frontend) + Supabase (Database/Auth) + GitHub (Code) + Vercel (Hosting) — ឥតគិតថ្លៃទាំងអស់។

---

## ជំហានទី ១ — បង្កើត Supabase Project

1. ចូល https://supabase.com → Sign up / Log in (អ្នកមាន account ហើយ)
2. ចុច **New Project**
3. ដាក់ឈ្មោះ Project (ឧ. `team-tasks`) + កំណត់ password database + ជ្រើស region ជិតបំផុត
4. រង់ចាំប្រហែល ១-២ នាទីឱ្យ Supabase បង្កើត project
5. ចូលទៅ **SQL Editor** (ម៉ឺនុយខាងឆ្វេង) → **New query**
6. បើកឯកសារ `supabase/schema.sql` ក្នុង zip នេះ → **copy ទាំងអស់** → **paste** ចូល SQL Editor → ចុច **Run**
   - នេះនឹងបង្កើត table៖ `profiles`, `tasks`, `tracker_jobs`, `telegram_settings` និង RLS policies ដោយស្វ័យប្រវត្តិ
7. ចូលទៅ **Authentication → Users** → ចុច **Add user** → បញ្ចូល email + password របស់អ្នកផ្ទាល់
   (admin ដំបូង) → **tick "Auto Confirm User"** → Create
8. ចុចលើ user ដែលអ្នកបង្កើត → copy **User UID**
9. ត្រឡប់ទៅ **SQL Editor** → **New query** → paste ខាងក្រោម (ដូរ UUID + ឈ្មោះ)៖
   ```sql
   insert into profiles (id, full_name, role) values ('YOUR-UUID-HERE', 'ឈ្មោះអ្នក', 'admin');
   ```
   → Run
10. ចូលទៅ **Project Settings (រូប⚙️) → API** → ចម្លងតម្លៃ ៣ យ៉ាងនេះទុក (ត្រូវការនៅជំហានក្រោយ)៖
    - **Project URL**
    - **anon public** key
    - **service_role** key (សម្ងាត់ - កុំចែករំលែក)

---

## ជំហានទី ២ — ដាក់កូដឡើង GitHub

1. ស្រាយ (extract) ZIP នេះក្នុងកុំព្យូទ័រ
2. ចូល https://github.com → ចុច **New repository** → ដាក់ឈ្មោះ (ឧ. `team-tasks`) → Create
3. នៅលើ repository ទំនេរនោះ ចុច **uploading an existing file**
4. **Drag & drop** ឯកសារ/folder ទាំងអស់ពី ZIP ចូល (លើកលែង `node_modules` បើមាន — មិនមាននៅទីនេះទេ)
5. សរសេរសារ commit ណាមួយ → ចុច **Commit changes**

> ជំនួសវិធីនេះក៏បានដែរ បើអ្នកមាន Git ក្នុងកុំព្យូទ័រ៖
> `git init && git add . && git commit -m "init" && git remote add origin <your-repo-url> && git push -u origin main`

---

## ជំហានទី ៣ — ដាក់ Deploy លើ Vercel

1. ចូល https://vercel.com → Log in ដោយ GitHub account
2. ចុច **Add New... → Project**
3. ជ្រើស repository `team-tasks` ដែលអ្នកបង្កើតថ្មីៗ → **Import**
4. មុននឹងចុច Deploy សូមបន្ថែម **Environment Variables** (ផ្នែក Environment Variables ក្នុងទំព័រ import)៖

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | (Project URL ពី Supabase) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon public key) |
   | `SUPABASE_SERVICE_ROLE_KEY` | (service_role key) |
   | `CRON_SECRET` | (សរសេរអក្សរ/លេខបណ្តើរណាមួយ ឧ. `tt2026secret`) |

5. ចុច **Deploy** → រង់ចាំ ១-២ នាទី
6. នៅពេលដំណើរការចប់ អ្នកនឹងបាន URL ឧ. `https://team-tasks.vercel.app`
7. ចូល URL នោះ → ប្រើ email/password admin ដែលអ្នកបង្កើតក្នុង Supabase ដើម្បីចូល (Login)

---

## ជំហានទី ៤ — បង្កើត Telegram Bot សម្រាប់ការរំលឹក

1. បើក Telegram → ស្វែងរក **@BotFather** → ចាប់ផ្ដើម chat
2. វាយ `/newbot` → ដាក់ឈ្មោះ bot → BotFather នឹងផ្តល់ **Bot Token** មកអ្នក (ចម្លងទុក)
3. បង្កើត Telegram Group ថ្មី (ឬប្រើ group ដែលមានស្រាប់) → បញ្ចូល bot ចូល group
4. ដើម្បីដឹង **Chat ID** របស់ group៖ ផ្ញើសារណាមួយក្នុង group រួចបើក URL នេះក្នុង browser
   (ដូរ `<TOKEN>` ជា token របស់អ្នក)៖
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
   → រកមើល `"chat":{"id":-100...}` → នោះជា Chat ID (ជាញឹកញាប់ជាលេខអវិជ្ជមាន ចាប់ផ្តើមដោយ `-100`)
5. ចូលទៅ App → **Admin tab** → បញ្ចូល **Bot Token** និង **Chat ID** → **រក្សាទុក** → ចុច **ផ្ញើសារសាកល្បង**
   ដើម្បីប្រាកដថាបានភ្ជាប់ត្រឹមត្រូវ

---

## ជំហានទី ៥ — ភ្ជាប់ Cron (ឱ្យការរំលឹកផ្ញើដោយស្វ័យប្រវត្តិ)

⚠️ **សំខាន់៖** Vercel គម្រោង Free (Hobby) អនុញ្ញាត Cron តែ **១ ដងក្នុងមួយថ្ងៃ** ប៉ុណ្ណោះ។
ដើម្បីឱ្យការរំលឹកដំណើរការគ្រប់ ៥ នាទីម្តង (ស្រប់ពេលជាមួយម៉ោងកំណត់) សូមប្រើសេវាឥតគិតថ្លៃខាងក្រៅ៖

1. ចូល https://cron-job.org → Sign up (ឥតគិតថ្លៃ)
2. ចុច **Create cronjob**
3. **URL** ដាក់៖ `https://YOUR-APP.vercel.app/api/cron?secret=YOUR_CRON_SECRET`
   (ដូរ `YOUR-APP` និង `YOUR_CRON_SECRET` តាមអ្នកដាក់ក្នុង Vercel Environment Variables)
4. **Schedule**: ជ្រើស "Every 5 minutes"
5. Save → ហើយ Cron នឹងហៅ App ឱ្យពិនិត្យ និងផ្ញើការរំលឹកដោយស្វ័យប្រវត្តិ ២៤ម៉ោង/ថ្ងៃ

---

## ការប្រើប្រាស់ប្រចាំថ្ងៃ

- **Admin** → tab "Admin" → បង្កើត account ឱ្យសមាជិកក្រុមម្នាក់ៗ (email + password)
- សមាជិកក្រុមម្នាក់ៗ login ដោយ email/password ដែល admin បង្កើតឱ្យ
- **ការងារត្រូវធ្វើ** → បន្ថែមកិច្ចការ កំណត់ម៉ោង/ថ្ងៃ + ម៉ោងរំលឹក → Telegram នឹងផ្ញើសារដោយស្វ័យប្រវត្តិ
- **កត់ត្រាការងារ** → កត់ត្រា ការងារនីមួយៗ ថ្ងៃចាប់ផ្តើម/ចប់ និងស្ថានភាព

---

## ការកែប្រែពេលក្រោយ

លោកអ្នកអាចថតរូបអេក្រង់ ឬប្រាប់ខ្ញុំថា **ឯណាក្នុងកម្មវិធី** ដែលចង់កែ (ឧ. "ប្តូរពណ៌ប៊ូតុង + បន្ថែម", "បន្ថែម field ថ្មីក្នុង Tracker")
ខ្ញុំនឹងកែកូដឱ្យ ហើយផ្ញើ ZIP ថ្មីមកអ្នកម្តងទៀត។ បន្ទាប់មកគ្រាន់តែ upload ឯកសារដែលផ្លាស់ប្តូរ ឡើង GitHub វិញ
(Vercel នឹង deploy ស្វ័យប្រវត្តិរាល់ពេលអ្នកប្តូរកូដក្នុង GitHub)។

## ឯកសារក្នុង Folder នេះ

```
app/                → ទំព័រនិង logic ទាំងអស់ (Next.js App Router)
  api/               → server endpoints (admin create-user, telegram test, cron)
  dashboard/         → Dashboard, Todo, Tracker, Admin pages
  login/             → ទំព័រ Login
components/          → NavTabs (menu khang leu)
lib/                 → supabase clients + telegram helper
supabase/schema.sql  → SQL ត្រូវ Run ក្នុង Supabase
vercel.json          → cron config (Hobby = 1x/ថ្ងៃ, recommand ប្រើ cron-job.org ខាងលើ)
.env.example         → គំរូ environment variables
```
