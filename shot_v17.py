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
                    r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=15); return r.status,r.read(),r.headers.get('content-type','application/json')
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
        async def theme(t):
            await pg.goto(URL+'#/settings'); await pg.wait_for_timeout(400)
            await pg.click(f'.seg button:text-is("{t}")'); await pg.wait_for_timeout(300)
        await theme('Light')
        await pg.goto(URL+'#/dashboard/cash'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='shots/v17-dashboard-light.png')
        card=pg.locator('.card.alloc').first
        await card.scroll_into_view_if_needed(); await card.screenshot(path='shots/v17-pie-light.png')
        await pg.click('.alloc .seg button >> nth=1'); await pg.wait_for_timeout(300)
        await card.screenshot(path='shots/v17-pie-accounts-light.png')
        await theme('Dark')
        await pg.goto(URL+'#/dashboard/investment'); await pg.wait_for_timeout(1200)
        card=pg.locator('.card.alloc').first
        await card.scroll_into_view_if_needed(); await card.screenshot(path='shots/v17-pie-dark.png')
        await pg.locator('.card.panel').last.screenshot(path='shots/v17-lines-dark.png')
        await theme('Light')
        await pg.select_option('.ccy-select select','USD'); await pg.wait_for_timeout(500)
        await pg.goto(URL+'#/path'); await pg.wait_for_timeout(1000)
        await pg.screenshot(path='shots/v17-path-usd.png')
        await pg.evaluate("window.scrollTo(0, document.querySelector('.path-card').getBoundingClientRect().bottom + window.scrollY - 844)"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='shots/v17-path-usd-start.png')
        await pg.select_option('.ccy-select select','GBP'); await pg.wait_for_timeout(300)
        await pg.goto(URL+'#/info/privacy'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='shots/v17-privacy.png')
        # footer click privacy -> terms
        await pg.click('footer a:has-text("Terms Of Use")', force=True) if await pg.locator('footer a:has-text("Terms Of Use")').is_visible() else await pg.goto(URL+'#/info/terms')
        await pg.wait_for_timeout(500)
        print('after click title:', await pg.locator('.info-card h1').inner_text(), pg.url)
        await pg.screenshot(path='shots/v17-terms.png')
        await pg.goto(URL+'#/info/about'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='shots/v17-about.png', full_page=True)
        await pg.goto(URL+'#/settings'); await pg.wait_for_timeout(500)
        async with pg.expect_download() as d:
            await pg.click('text=Export to Excel')
        dl=await d.value; await dl.save_as('shots/Cardinal_example_export.xlsx'); print('xlsx',dl.suggested_filename)
        print('errors',errs)
        await b.close()
asyncio.run(run()); srv.terminate()
