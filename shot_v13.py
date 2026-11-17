import asyncio, os
from playwright.async_api import async_playwright
URL='http://localhost:4173/'
async def run():
    async with async_playwright() as p:
        b=await p.chromium.launch(); errs=[]
        for name,vp,mob in [('mobile',{'width':390,'height':844},True),('desktop',{'width':1280,'height':900},False)]:
            ctx=await b.new_context(viewport=vp,device_scale_factor=2,is_mobile=mob,has_touch=mob)
            pg=await ctx.new_page()
            pg.on('pageerror',lambda e,n=name:errs.append(f'{n} {e}'))
            pg.on('console',lambda m,n=name:m.type=='error' and 'ERR_' not in m.text and errs.append(f'{n} {m.text}'))
            async def shot(s):
                h=await pg.evaluate('document.documentElement.scrollHeight')
                await pg.set_viewport_size({'width':vp['width'],'height':h}); await pg.wait_for_timeout(1000)
                await pg.screenshot(path=f'shots/{name}-v13-{s}.png'); await pg.set_viewport_size(vp); await pg.wait_for_timeout(200)
            await pg.goto(URL); await pg.click('text=Register now')
            await pg.fill('input[autocomplete=given-name]','Filipe'); await pg.fill('input[autocomplete=family-name]','Pereira')
            await pg.fill('input[type=email]','f@example.com'); await pg.fill('input[type=password]','Cardinal2026!')
            await pg.click('button:has-text("Create account")'); await pg.wait_for_timeout(500)
            await pg.click('text=Go to my dashboard'); await pg.click('text=Explore with sample data'); await pg.wait_for_timeout(1500)
            await pg.click('.range-tabs button:has-text("All")'); await pg.wait_for_timeout(400)
            await pg.check('.forecast-bar input'); await pg.wait_for_timeout(800)
            await shot('01-forecast')
            await pg.locator('.alloc').scroll_into_view_if_needed()
            sl=pg.locator('.alloc input[type=range]'); await sl.evaluate('e=>{const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set; s.call(e, Math.round(e.max*0.3)); e.dispatchEvent(new Event("input",{bubbles:true}))}')
            await pg.wait_for_timeout(500)
            await pg.locator('.alloc').screenshot(path=f'shots/{name}-v13-02-pie-past.png')
            await pg.click('.alloc .seg button:has-text("By account")'); await pg.wait_for_timeout(400)
            await pg.locator('.alloc').screenshot(path=f'shots/{name}-v13-03-pie-accounts.png')
            await pg.goto(URL+'#/path'); await pg.wait_for_timeout(800)
            await shot('04-path')
            await pg.goto(URL+'#/dashboard/assets'); await pg.wait_for_timeout(400)
            await pg.click('.panel-actions button:has-text("Add")'); await pg.click('.modal .chip:has-text("Property")')
            await pg.fill('.modal input[placeholder="Street, city"]','Bramham Gardens, London'); await pg.fill('.modal input[placeholder="SW5 0JQ"]','SW5 0JQ'); await pg.fill('.modal input[placeholder="75"]','80')
            await pg.wait_for_timeout(300)
            print(name,'estimate box:',(await pg.locator('.modal .hpi-card').inner_text()).split('\n')[0])
            await pg.screenshot(path=f'shots/{name}-v13-05-add-property-area.png')
            await pg.click('.modal .hpi-card button'); await pg.click('.modal button:has-text("Add")'); await pg.wait_for_timeout(500)
            await pg.click('.row:has-text("Bramham")'); await pg.wait_for_timeout(2500)
            await shot('06-property-detail')
            await ctx.close()
        print('ERRORS',sorted(set(errs)) or 'none'); await b.close()
asyncio.run(run())
