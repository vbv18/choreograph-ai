import motion from "motion";

export default function LoadingAnimation() {
    return (
        <div className="flex items-center gap-3 max-w-[72%] py-1">
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                {
                    [0, 0.45, 0.90].map((delay, i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 rounded-full border border-cyan-400/30"
                            initial={{ scale: 0.3, opacity: 0.55 }}
                            animate={{ scale: 1.7, opacity: 0 }}
                            transition={{
                                duration: 1.8,
                                repeat: Infinity,
                                delay,
                                ease: "easeOut",
                            }}
                        />

                    ))
                }
            </div>
        </div>
    )
}