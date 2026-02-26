import {
  HomeLayout,
  MasteryArea,
  MasteryGridCard,
  ProgressCard,
} from "../../container/WordTraining/styles";
import {
  SkeletonBlock,
  SkeletonCell,
  SkeletonCircle,
  SkeletonGrid,
  SkeletonTopLeft,
  SkeletonTopRow,
} from "./styles";

export function TrainingHomeSkeleton() {
  return (
    <HomeLayout>
      <ProgressCard aria-busy="true" aria-label="Загрузка тренировки">
        <SkeletonTopRow>
          <SkeletonTopLeft>
            <SkeletonBlock $height={16} $width="56%" />
            <SkeletonBlock $height={5} />
          </SkeletonTopLeft>
          <SkeletonCircle />
        </SkeletonTopRow>
        <SkeletonBlock $height={52} />
      </ProgressCard>

      <MasteryArea>
        <MasteryGridCard $fillHeight>
          <SkeletonBlock $height={24} $width="45%" />
          <SkeletonGrid>
            {Array.from({ length: 23 * 16 }).map((_, index) => (
              <SkeletonCell key={index} />
            ))}
          </SkeletonGrid>
        </MasteryGridCard>
      </MasteryArea>
    </HomeLayout>
  );
}

export default TrainingHomeSkeleton;
