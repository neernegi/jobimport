function normalizeFeedItems(parsedJson) {
  let items = [];
  if (!parsedJson) return items;

  if (parsedJson.rss && parsedJson.rss.channel) {
    const channel = parsedJson.rss.channel;
    items = channel.item ? (Array.isArray(channel.item) ? channel.item : [channel.item]) : [];
  } else if (parsedJson.feed && parsedJson.feed.entry) {
    items = Array.isArray(parsedJson.feed.entry) ? parsedJson.feed.entry : [parsedJson.feed.entry];
  } else if (parsedJson.items) {
    items = Array.isArray(parsedJson.items) ? parsedJson.items : [parsedJson.items];
  }

  return items.map(it => ({
    title: it.title && (it.title._ || it.title) || it.job_title || '',
    link: it.link && (typeof it.link === 'object' ? it.link.href : it.link) || it.url || it.guid || '',
    guid: it.guid && (it.guid._ || it.guid) || (it.id && (it.id._ || it.id)) || '',
    description: it.description || it.summary || it.content || '',
    company: it['company'] || it['hiringOrganization'] || '',
    location: it.location || it['job_location'] || '',
    categories: it.category ? (Array.isArray(it.category) ? it.category.map(c => c._ || c) : [it.category._ || it.category]) : []
  }));
}

module.exports = { normalizeFeedItems };
