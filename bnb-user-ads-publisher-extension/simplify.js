// simplify.js  (ESM version)

export function simplifyBinanceResponse(resp) {
    if (!resp || !Array.isArray(resp.data)) {
        return { tradeType: null, ads: [] };
    }

    const ads = [];
    let tradeType = null;

    for (const item of resp.data) {
        const adv = item.adv || {};
        const advertiser = item.advertiser || {};

        if (!tradeType) tradeType = adv.tradeType;

        ads.push({
            advNo: adv.advNo,
            asset: adv.asset,
            fiat: adv.fiatUnit,
            price: adv.price,
            minAmount: adv.minSingleTransAmount,
            maxAmount: adv.maxSingleTransAmount,
            tradableQuantity: adv.tradableQuantity,
            surplusAmount: adv.surplusAmount,
            merchant: advertiser.nickName,
            merchantType: advertiser.userType,
            orderCount30d: advertiser.monthOrderCount,
            finishRate30d: advertiser.monthFinishRate
        });
    }

    return {
        tradeType,
        ads
    };
}
