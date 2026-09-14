import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { BRAND } from "@/lib/site/brand";

export const metadata: Metadata = {
  title: `Privacy · ${BRAND.name}`,
  description: "What ReAround You sends, stores and never collects during the beta.",
};

/**
 * 隐私说明。按实际数据流写，不用模板：什么数据为了什么目的发到哪里、存多久。
 * 改了数据流（换模型、加统计、加账号）必须同步改这里和 BRAND.legalUpdated。
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" intro={`${BRAND.name} is a beta. This page says plainly what the app sends, what it keeps, and what it never collects. There is no account, no advertising, and no tracking across other sites.`}>
      <section>
        <h2>The short version</h2>
        <ul>
          <li>Your location is used to find places around you. It is sent to our server for each search and is not stored there.</li>
          <li>Questions you type, photos you take for recognition, and the text of stories are sent to an AI provider to generate answers and speech. We do not build a profile from them.</li>
          <li>Everything personal to you (favorites, chat history, chosen guide, settings) lives in your browser or the app on your device. Clearing site data removes it.</li>
          <li>If you leave your email to get notified, we store only that email address.</li>
        </ul>
      </section>

      <section>
        <h2>What is sent, where, and why</h2>
        <div className="overflow-x-auto">
        <table style={{ minWidth: 560 }}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Sent to</th>
              <th>Purpose</th>
              <th>Kept</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Map position (latitude / longitude of the area you are browsing, or your device location if you allow it)</td>
              <td>Our server, which queries Wikipedia, Wikidata, Wikivoyage and OpenStreetMap (Overpass, Nominatim, map tiles) on your behalf. In mainland China, AutoNavi (Amap) when configured.</td>
              <td>List places around you, name the area, plan a short walking route</td>
              <td>Not stored. Server logs of the hosting provider may keep request metadata for a short time.</td>
            </tr>
            <tr>
              <td>Place name and public description, your questions, the conversation on a place page</td>
              <td>Our server, then an AI language model provider (currently Zhipu AI, based in China)</td>
              <td>Generate the guide&rsquo;s story and answers</td>
              <td>Stories for a place are cached on our server without any user identifier. Conversations are kept only on your device.</td>
            </tr>
            <tr>
              <td>Photos you take with &ldquo;What&rsquo;s this?&rdquo; or &ldquo;Translate&rdquo;</td>
              <td>Our server, then the AI provider&rsquo;s vision model</td>
              <td>Recognize the building or sign, read the text</td>
              <td>Not stored by us. Sent only when you press the button.</td>
            </tr>
            <tr>
              <td>Sentences of the story being read aloud</td>
              <td>Our server, then Microsoft&rsquo;s neural text-to-speech service</td>
              <td>Produce the guide&rsquo;s voice</td>
              <td>Not stored by us.</td>
            </tr>
            <tr>
              <td>Voice recordings (only if voice questions are enabled in your build)</td>
              <td>A speech-to-text provider configured by the operator</td>
              <td>Turn your question into text</td>
              <td>Not stored by us.</td>
            </tr>
            <tr>
              <td>Email address (optional, &ldquo;Get notified&rdquo;)</td>
              <td>Our database (Upstash Redis)</td>
              <td>Tell you when accounts and Plus open</td>
              <td>Until you ask us to delete it.</td>
            </tr>
            <tr>
              <td>Your IP address</td>
              <td>Our server</td>
              <td>Rate limiting so free resources are shared fairly; hosting logs</td>
              <td>Rate-limit counters expire within one hour. No IP is linked to your content.</td>
            </tr>
          </tbody>
        </table>
        </div>
      </section>

      <section>
        <h2>What stays on your device</h2>
        <p>
          Favorites, offline copies of places you saved, chat history, your chosen guide and language, the mute setting, and a small local log of how fast stories started (used only on your device to spot slowness). None of this is uploaded. Deleting the app or clearing browser data removes it.
        </p>
      </section>

      <section>
        <h2>What we do not do</h2>
        <ul>
          <li>No advertising, no analytics SDKs, no fingerprinting, no cookies used for tracking.</li>
          <li>No account is required and no password is collected during the beta.</li>
          <li>We do not sell or share personal data with anyone other than the service providers listed above, who process it to deliver the feature you asked for.</li>
          <li>We do not record your movements. Each search stands alone; there is no route history on our servers.</li>
        </ul>
      </section>

      <section>
        <h2>Providers outside your country</h2>
        <p>
          Hosting, the AI model and the speech service may run outside the country you are in, including in the United States and China. During the beta we use them because they are available at no cost to you. If this matters to you, you can use the app without the AI features: the place list, maps and public descriptions still work, and reading aloud can be switched to your device&rsquo;s own voice in Settings.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>The service is not directed at children under 16. The &ldquo;for kids&rdquo; storytelling style is meant for adults exploring with children.</p>
      </section>

      <section>
        <h2>Your choices and rights</h2>
        <ul>
          <li>Location, camera and microphone access are asked for by your browser or phone and can be refused; you can then pick a place on the map by hand.</li>
          <li>To delete an email address you left with us, write to <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>. During the beta this mailbox may not be monitored daily; we will confirm when it is done.</li>
          <li>Depending on where you live you may have rights to access, correct or erase personal data. Use the same address.</li>
        </ul>
      </section>

      <section>
        <h2>Changes</h2>
        <p>When the data flows change (for example a different AI provider, accounts, or analytics), this page is updated and the date at the top changes. Material changes will be mentioned inside the app.</p>
      </section>

      <section>
        <h2>Who we are</h2>
        <p>
          {BRAND.name} is operated by {BRAND.operator}. Contact: <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
