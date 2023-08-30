const fs = require("fs");
const { Cluster } = require("puppeteer-cluster");

const urls = ['https://www.google.com/search?rlz=1C1GCEV_enBR836BR836&ei=5rxBXaaoL4q65OUPp-uPkAM&q=X',
'https://www.google.com/search?rlz=1C1GCEV_enBR836BR836&ei=5rxBXaaoL4q65OUPp-uPkAM&q=Y3',
'https://www.google.com/search?rlz=1C1GCEV_enBR836BR836&ei=5rxBXaaoL4q65OUPp-uPkAM&q=Younder%20Edtech',
'https://www.google.com/search?rlz=1C1GCEV_enBR836BR836&ei=5rxBXaaoL4q65OUPp-uPkAM&q=Zapping%20TV',
'https://www.google.com/search?rlz=1C1GCEV_enBR836BR836&ei=5rxBXaaoL4q65OUPp-uPkAM&q=ZEROFILA',
'https://www.google.com/search?rlz=1C1GCEV_enBR836BR836&ei=5rxBXaaoL4q65OUPp-uPkAM&q=Zeus%20Automa%C3%A7%C3%A3o%20Comercial',
'https://www.google.com/search?rlz=1C1GCEV_enBR836BR836&ei=5rxBXaaoL4q65OUPp-uPkAM&q=Zeus%20Automa%C3%A7%C3%A3o%20Comercial',]; // Seus URLs aqui

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 5,
    monitor: true,
    puppeteerOptions: {
      headless: false,
      defaultViewport: false,
      userDataDir: "./tmp",
    },
  });

  cluster.on("taskerror", (err, data) => {
    console.log(`Error crawling ${data}: ${err.message}`);
  });

  let sites = [];

  await cluster.task(async ({ page, data: url }) => {
    await page.goto(url);

    try {
      const link = await page.evaluate(() => {
        const firstLinkElement = document.querySelector("div .yuRUbf a");
        return firstLinkElement ? firstLinkElement.getAttribute("href") : null;
      });

      if (link) {
        sites.push(link);
      }

    } catch (error) {
      console.error("Error during page evaluation:", error);
    }
  });

  const batchSize = 3;
  const delayBetweenBatches = 7000; // 10 segundos

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    
    for (const url of batch) {
      await cluster.queue(url);
    }

    await cluster.idle();
    
    if (i + batchSize < urls.length) {
      console.log(`Waiting ${delayBetweenBatches / 1000} seconds before the next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  await cluster.close();

  console.log(sites);
})();