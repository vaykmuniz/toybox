import { Toy } from "@/services/profile-api";
import { Text, View } from "react-native";
import CustomImage from "../ui/custom-image/custom-image.component";
import { OddProgressBar } from "../views/odds/odd-progress-bar.component";

interface ToyOddsProps {
    toy: Partial<Toy>;
}


export default function ToyOdds({ toy }: ToyOddsProps) {
    if (!toy.caption) {
        return null;
    }

    return <View
        key={toy.id}
        className="flex-row flex-wrap justify-center items-center gap-3 p-0.5">
        <View
            className="p-0.5"
            style={{ aspectRatio: 1, flexBasis: '33.333%' }}>
            <View className="h-full w-full overflow-hidden bg-white/45 rounded-lg">
                <CustomImage
                    accessibilityLabel={toy.caption ?? 'Toy post'}
                    contentFit="cover"
                    source={toy.media_url}
                />
                {toy?.caption ? (
                    <View className="absolute inset-x-0 bottom-0 bg-ink/70 px-2 py-1">
                        <Text
                            className="font-display text-xs font-bold text-white"
                            numberOfLines={1}>
                            {toy?.caption}
                        </Text>
                    </View>
                ) : null}

            </View>
        </View>
        <View className="min-w-0 flex-1 items-start">
            <OddProgressBar value={0.2} />
        </View>
    </View>;
}