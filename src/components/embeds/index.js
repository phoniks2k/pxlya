/*
 * Embeds for external content like youtube, etc.
 *
 */
import TikTok from './TikTok';
import YouTube from './YouTube';
import Matrix from './Matrix';
import DirectLinkMedia from './DirectLinkMedia';

/*
 * key is the domain (with .com and www. stripped)
 * value is an Array with
 *  [
 *    ReactElement: takes url as prop,
 *    isEmbedAvailable: function that takes url as argument and returns boolean
 *                      whether embed is available for this url of this domain
 *  ]
 */
export default {
  tiktok: TikTok,
  youtube: YouTube,
  'youtu.be': YouTube,
  'matrix.pixelplanet.fun': Matrix,
  'i.4cdn.org': DirectLinkMedia,
  'i.imgur': DirectLinkMedia,
  'litter.catbox.moe': DirectLinkMedia,
  'files.catbox.moe': DirectLinkMedia,
  'i.redd.it': DirectLinkMedia,
  'media.consumeproduct.win': DirectLinkMedia,
};
