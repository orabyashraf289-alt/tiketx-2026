import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { Course1Tickets } from "./courses/Course1Tickets";
import { Course2Team } from "./courses/Course2Team";
import { Course3SLA } from "./courses/Course3SLA";
import { Course4Classera } from "./courses/Course4Classera";
import { Course5Automation } from "./courses/Course5Automation";
import { Course6Reports } from "./courses/Course6Reports";
import { Course7Security } from "./courses/Course7Security";
import { Course8Tenant } from "./courses/Course8Tenant";

const SHARED = { fps: 30, width: 1920, height: 1080, durationInFrames: 320 };

export const RemotionRoot = () => (
  <>
    <Composition id="main" component={MainVideo} durationInFrames={600} fps={30} width={1920} height={1080} />
    <Composition id="course1" component={Course1Tickets} {...SHARED} />
    <Composition id="course2" component={Course2Team} {...SHARED} />
    <Composition id="course3" component={Course3SLA} {...SHARED} />
    <Composition id="course4" component={Course4Classera} {...SHARED} />
    <Composition id="course5" component={Course5Automation} {...SHARED} />
    <Composition id="course6" component={Course6Reports} {...SHARED} />
    <Composition id="course7" component={Course7Security} {...SHARED} />
    <Composition id="course8" component={Course8Tenant} {...SHARED} />
  </>
);
