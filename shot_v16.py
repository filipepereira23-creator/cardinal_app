import asyncio, subprocess, time, os, urllib.request
from playwright.async_api import async_playwright
URL='http://localhost:4173/'
os.makedirs('shots', exist_ok=True)
srv=subprocess.Popen(['npx','vite','preview','--port','4173','--strictPort'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(4)
async def run():
    async with async_playwright() as p:
        b=await p.chromium.launch(); errs=[]
        ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,timezone_id='Europe/London')
        pg=await ctx.new_page()
        async def proxy(route):
            u=route.request.url
            if u.startswith('http://localhost'): return await route.continue_()
            def get():
                try:
                    r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=20); return r.status,r.read(),r.headers.get('content-type','application/json')
                except urllib.error.HTTPError as e: return e.code,e.read(),'text/plain'
                except Exception as e: return 502,str(e).encode(),'text/plain'
            st,body,ct=await asyncio.to_thread(get)
            await route.fulfill(status=st,body=body,headers={'content-type':ct,'access-control-allow-origin':'*'})
        await ctx.route('**/*',proxy)
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(URL); await pg.click('text=Register now')
        await pg.fill('input[autocomplete=given-name]','Filipe'); await pg.fill('input[autocomplete=family-name]','Pereira')
        await pg.fill('input[type=email]','f@example.com'); await pg.fill('input[type=password]','Cardinal2026!')
        await pg.click('button:has-text("Create account")'); await pg.wait_for_timeout(500)
        await pg.click('text=Go to my dashboard'); await pg.click('text=Explore with sample data'); await pg.wait_for_timeout(2000)
        print('theme', await pg.evaluate('document.documentElement.dataset.theme'))
        await pg.screenshot(path='shots/v16-dashboard.png')
        await pg.goto(URL+'#/connections'); await pg.wait_for_timeout(600)
        await pg.click('text=Show example friends'); await pg.wait_for_timeout(400)
        await pg.screenshot(path='shots/v16-connections.png', full_page=True)
        await pg.locator('.card:has(.eyebrow:text-is("Rankings"))').first.screenshot(path='shots/v16-rankings.png')
        await pg.click('button:has-text("Money made")'); await pg.wait_for_timeout(200)
        await pg.locator('.card:has(.eyebrow:text-is("Rankings"))').first.screenshot(path='shots/v16-rankings-money.png')
        await pg.click('.conn-optin input'); await pg.wait_for_timeout(300)
        await pg.locator('.card:has(.eyebrow:text-is("Reports"))').first.screenshot(path='shots/v16-reports.png')
        await pg.goto(URL+'#/settings'); await pg.wait_for_timeout(500)
        await pg.locator('.card:has-text("Appearance")').first.screenshot(path='shots/v16-theme.png')
        print('errors',errs)
        await b.close()
asyncio.run(run()); srv.terminate()
